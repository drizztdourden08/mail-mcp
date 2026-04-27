import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn, execSync, type ChildProcess } from "child_process";
import type { IpcClient } from "./ipc-client";

const IPC_PORT_FILE = path.join(os.homedir(), ".mail-mcp", "ipc-port");
const CLIENT_ID = "ab2d883c-b77b-4bcc-ac96-6bc75f66b3b4";

export class ServerManager {
  private process: ChildProcess | null = null;
  private readonly output: vscode.OutputChannel;
  private readonly serverScript: string;
  private portDiscoveryInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly ipcClient: IpcClient,
    output: vscode.OutputChannel,
  ) {
    this.output = output;
    this.serverScript = path.join(context.extensionPath, "..", "mcp-server", "dist", "index.js");
    context.subscriptions.push({ dispose: () => this.dispose() });
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  getScriptPath(): string {
    return this.serverScript;
  }

  /** Start the MCP server (auto-detect if one is already running). */
  async autoStart(): Promise<void> {
    this.output.appendLine(`[server] script path: ${this.serverScript}`);
    if (!fs.existsSync(this.serverScript)) {
      this.output.appendLine("[server] script not found — skipping");
      return;
    }

    try {
      const portStr = fs.readFileSync(IPC_PORT_FILE, "utf-8").trim();
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
    setTimeout(() => this.start(), 800);
  }

  /** Poll the port file until the server is reachable. Returns when connected. */
  discoverPort(
    onConnected: (port: number) => void,
  ): void {
    const tryRead = async (): Promise<boolean> => {
      try {
        const portStr = fs.readFileSync(IPC_PORT_FILE, "utf-8").trim();
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
      env: { ...process.env, MAIL_MCP_CLIENT_ID: CLIENT_ID },
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
    const port = this.ipcClient.getPort() || 3101;
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
    try { fs.unlinkSync(IPC_PORT_FILE); } catch { /* ignore */ }
  }

  private dispose(): void {
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
