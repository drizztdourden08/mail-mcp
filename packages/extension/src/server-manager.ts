import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn, execSync, type ChildProcess } from "child_process";
import type { IpcClient } from "./ipc-client";
import * as dotenv from "dotenv";

const CONFIG_DIR = path.join(os.homedir(), ".mail-mcp");

// Try loading .env from each open workspace folder
for (const folder of vscode.workspace.workspaceFolders ?? []) {
  dotenv.config({ path: path.join(folder.uri.fsPath, ".env") });
}

/**
 * Known provider env-var mappings.
 * Each entry maps a providerConfig key ("providerId.fieldKey") to its env var.
 */
const PROVIDER_ENV_MAP: Record<string, string> = {
  "exchange.clientId": "MAIL_MCP_CLIENT_ID",
};

/**
 * Resolve a provider config value.
 * Priority: VS Code setting → .env / process.env → empty string.
 */
function resolveProviderConfigValue(configKey: string, envVar: string): string {
  const cfg = vscode.workspace.getConfiguration("mail-mcp");
  const providerConfig = cfg.get<Record<string, string>>("providerConfig", {});
  return providerConfig[configKey] || process.env[envVar] || "";
}

/**
 * Build the set of environment variables that all registered providers need,
 * resolved through VS Code settings → .env → process.env.
 */
function buildProviderEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [configKey, envVar] of Object.entries(PROVIDER_ENV_MAP)) {
    const value = resolveProviderConfigValue(configKey, envVar);
    if (value) env[envVar] = value;
  }
  return env;
}

export class ServerManager {
  private process: ChildProcess | null = null;
  private readonly output: vscode.OutputChannel;
  private readonly serverScript: string;
  private portDiscoveryInterval?: ReturnType<typeof setInterval>;
  private restartTimer?: ReturnType<typeof setTimeout>;

  private readonly portFile: string;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly ipcClient: IpcClient,
    output: vscode.OutputChannel,
  ) {
    this.output = output;
    this.serverScript = path.join(context.extensionPath, "dist", "mcp-server", "index.js");
    // Instance-specific port file based on VS Code storage URI (unique per window)
    const instanceId = Buffer.from(context.storageUri?.toString() ?? Date.now().toString())
      .toString("base64url").slice(0, 12);
    this.portFile = path.join(CONFIG_DIR, `ipc-port-${instanceId}`);
    this.output.appendLine(`[server] port file: ${this.portFile}`);
    context.subscriptions.push({ dispose: () => this.dispose() });
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  /** Start the MCP server (auto-detect if one is already running). */
  async autoStart(): Promise<void> {
    this.output.appendLine(`[server] script path: ${this.serverScript}`);
    if (!fs.existsSync(this.serverScript)) {
      this.output.appendLine("[server] script not found — skipping");
      return;
    }

    // Check if THIS instance's server is still alive
    try {
      const portStr = fs.readFileSync(this.portFile, "utf-8").trim();
      const port = parseInt(portStr, 10);
      if (port > 0) {
        this.output.appendLine(`[server] port file found: ${port} — pinging...`);
        const res = await fetch(`http://127.0.0.1:${port}/status`);
        if (res.ok) {
          this.output.appendLine(`[server] existing server alive on port ${port}`);
          return;
        }
      }
    } catch { /* no port file or ping failed */ }

    this.spawn();
  }

  /** Force-start a fresh server (kills any existing). */
  start(): void {
    if (!fs.existsSync(this.serverScript)) {
      this.output.appendLine("[server] script not found");
      vscode.window.showErrorMessage("Mail MCP: server script not found.");
      return;
    }
    if (this.isRunning()) {
      this.output.appendLine("[server] already running");
      return;
    }
    this.killOnPort();
    this.cleanPortFile();
    this.spawn();
    this.output.appendLine("[server] started");
  }

  stop(): void {
    if (this.process) {
      if (this.process.pid) {
        this.killProcessTree(this.process.pid);
      } else {
        this.process.kill();
      }
      this.process = null;
    }
    this.killOnPort();
    this.ipcClient.setPort(0);
    this.cleanPortFile();
    this.output.appendLine("[server] stopped");
  }

  restart(): void {
    this.output.appendLine("[server] restarting...");
    this.stop();
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => this.start(), 800);
  }

  /** Poll the port file until the server is reachable. Returns when connected. */
  discoverPort(
    onConnected: (port: number) => void,
  ): void {
    const tryRead = async (): Promise<boolean> => {
      try {
        const portStr = fs.readFileSync(this.portFile, "utf-8").trim();
        const port = parseInt(portStr, 10);
        if (!port) return false;
        const res = await fetch(`http://127.0.0.1:${port}/status`);
        if (res.ok) {
          this.ipcClient.setPort(port);
          onConnected(port);
          return true;
        }
      } catch { /* not ready yet */ }
      return false;
    };

    tryRead().then((found) => {
      if (found) return;
      this.portDiscoveryInterval = setInterval(async () => {
        if (await tryRead()) {
          clearInterval(this.portDiscoveryInterval!);
          this.portDiscoveryInterval = undefined;
        }
      }, 3000);
    });
  }

  private spawn(): void {
    this.output.appendLine(`[spawn] node ${this.serverScript}`);
    this.process = spawn("node", [this.serverScript], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        ...buildProviderEnv(),
        MAIL_MCP_PORT_FILE: this.portFile,
        MAIL_MCP_PORT: "0",
      },
    });

    this.process.stdout?.on("data", (d: Buffer) => {
      this.output.appendLine(d.toString().trimEnd());
    });
    this.process.stderr?.on("data", (d: Buffer) => {
      this.output.appendLine(d.toString().trimEnd());
    });
    this.process.on("error", (err) => {
      this.output.appendLine(`[spawn error] ${err.message}`);
      vscode.window.showErrorMessage(`Mail MCP: failed to start server — ${err.message}`);
    });
    this.process.on("exit", (code) => {
      this.output.appendLine(`[server exit] code ${code}`);
      this.process = null;
    });
  }

  private killOnPort(): boolean {
    const port = this.ipcClient.getPort();
    if (!port) return false;
    try {
      const out = execSync(`netstat -ano | findstr "LISTENING" | findstr ":${port} "`, { encoding: "utf-8", timeout: 3000 });
      const match = out.match(/LISTENING\s+(\d+)/);
      if (match) {
        execSync(`taskkill /F /PID ${match[1]}`, { timeout: 3000 });
        this.output.appendLine(`[server] killed PID ${match[1]} on port ${port}`);
        return true;
      }
    } catch { /* no process found */ }
    return false;
  }

  private cleanPortFile(): void {
    try { fs.unlinkSync(this.portFile); } catch { /* ignore */ }
  }

  private dispose(): void {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    if (this.portDiscoveryInterval) clearInterval(this.portDiscoveryInterval);
    if (this.process && this.process.pid) {
      this.killProcessTree(this.process.pid);
    }
    this.process = null;
    this.killOnPort();
    this.cleanPortFile();
  }

  /** Kill a process and its children on Windows (taskkill /T), or just signal on *nix. */
  private killProcessTree(pid: number): void {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /F /T /PID ${pid}`, { timeout: 5000 });
      } else {
        this.process?.kill("SIGTERM");
      }
    } catch { /* process may have already exited */ }
  }
}
