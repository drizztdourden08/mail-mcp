import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { IpcClient } from "./ipc-client";
import { stopMcpServer, startMcpServerManual, restartMcpServer, isServerRunning } from "./extension";

const MCP_TOKEN_CACHE = path.join(os.homedir(), ".mail-mcp", "token_cache.json");

/** Fetch with a timeout to prevent hanging when the MCP server is unresponsive. */
function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  return Promise.race([
    fetch(url, init),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("fetch timeout")), timeoutMs),
    ),
  ]);
}

/** Check the MCP server's token cache file directly — works before the server starts */
function hasCachedMcpToken(): boolean {
  try {
    const raw = fs.readFileSync(MCP_TOKEN_CACHE, "utf-8");
    const data = JSON.parse(raw);
    return data && Object.keys(data.Account ?? {}).length > 0;
  } catch {
    return false;
  }
}

export class OutlookWebviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private pendingChallenge: { code: string; uri: string; expiresIn?: number; source?: string } | null = null;
  private lastKnownLoggedIn: boolean | null = null;
  private ipcIsReady = false;
  private cachedProviders: unknown[] | null = null;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly ipc: IpcClient,
  ) {}

  /** Pre-fetch providers when IPC becomes available so Setup opens instantly. */
  refreshProviderCache(): void {
    const port = this.ipc.getPort();
    if (!port) { this.cachedProviders = null; return; }
    fetchWithTimeout(`http://127.0.0.1:${port}/providers`, { method: "POST" }, 3000)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        this.cachedProviders = data as unknown[];
        // Push to webview so it updates without needing a re-request
        this.postToWebview({ type: "providers", providers: this.cachedProviders });
      })
      .catch(() => { /* best effort */ });
  }

  /** Push custom instructions from VS Code settings to the MCP server on connect. */
  syncCustomInstructionsToServer(port: number): void {
    const cfg = vscode.workspace.getConfiguration("mail-mcp");
    const content = cfg.get<string>("customInstructions", "");
    if (!content) return;
    fetchWithTimeout(
      `http://127.0.0.1:${port}/instructions/custom`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) },
    ).catch(() => { /* best effort */ });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "..", "webview", "dist"),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg) => {
      this.handleMessage(msg);
    });

    // Push settings to webview when VS Code settings change
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("mail-mcp")) {
        this.pushSettings();
      }
    });
  }

  private pushSettings() {
    const cfg = vscode.workspace.getConfiguration("mail-mcp");
    this.postToWebview({
      type: "settings",
      autoCopyCode: cfg.get<boolean>("autoCopyCode", true),
      autoOpenBrowser: cfg.get<boolean>("autoOpenBrowser", true),
      focusOnReview: cfg.get<boolean>("focusOnReview", true),
    });
    // Also push custom instructions in case it changed externally
    this.postToWebview({
      type: "custom-instructions",
      content: cfg.get<string>("customInstructions", ""),
    });
  }

  postToWebview(message: unknown) {
    const msg = message as { type: string; [k: string]: unknown };
    if (msg.type === "auth-challenge") {
      const sameCode = this.pendingChallenge?.code === (msg.code as string);
      this.pendingChallenge = {
        code: msg.code as string,
        uri: msg.uri as string,
        expiresIn: (msg.expiresIn as number | undefined) ?? (sameCode ? this.pendingChallenge?.expiresIn : undefined),
        source: sameCode ? (this.pendingChallenge?.source ?? msg.source as string | undefined) : (msg.source as string | undefined),
      };
      // Ensure the forwarded message carries the preserved values
      msg.source = this.pendingChallenge.source;
      msg.expiresIn = this.pendingChallenge.expiresIn;
    } else if (msg.type === "auth-status") {
      this.lastKnownLoggedIn = msg.loggedIn as boolean;
      if (msg.loggedIn) this.pendingChallenge = null;
    } else if (msg.type === "ipc-ready") {
      this.ipcIsReady = true;
    }
    this.view?.webview.postMessage(message);
  }

  private async handleMessage(msg: { type: string; [key: string]: unknown }) {
    switch (msg.type) {
      case "ready": {
        if (this.lastKnownLoggedIn !== null) {
          this.postToWebview({ type: "auth-status", loggedIn: this.lastKnownLoggedIn });
          if (this.pendingChallenge) {
            this.postToWebview({ type: "auth-challenge", ...this.pendingChallenge });
          }
          if (this.ipcIsReady) {
            this.postToWebview({ type: "ipc-ready" });
          }
          break;
        }
        // Query IPC (source of truth) or fall back to token cache file
        let loggedIn = false;
        try {
          const port = this.ipc.getPort();
          if (port) {
            const res = await fetchWithTimeout(`http://127.0.0.1:${port}/auth/status`, { method: "POST" });
            if (res.ok) {
              const data = await res.json() as { loggedIn: boolean };
              loggedIn = data.loggedIn;
            }
          }
        } catch { /* IPC not ready or timed out */ }

        if (!loggedIn) {
          loggedIn = hasCachedMcpToken();
        }

        this.postToWebview({ type: "auth-status", loggedIn });
        if (this.pendingChallenge) {
          this.postToWebview({ type: "auth-challenge", ...this.pendingChallenge });
        }
        if (this.ipcIsReady) {
          this.postToWebview({ type: "ipc-ready" });
        }
        break;
      }

      case "open-url": {
        Promise.resolve(vscode.env.openExternal(vscode.Uri.parse(msg.url as string))).catch(() => {});
        break;
      }

      case "get-auth-challenge": {
        if (this.pendingChallenge) {
          this.postToWebview({ type: "auth-challenge", ...this.pendingChallenge });
        }
        break;
      }

      case "copy-to-clipboard": {
        await vscode.env.clipboard.writeText(msg.text as string);
        break;
      }

      case "get-providers": {
        // Return cached providers instantly; refresh cache in background
        if (this.cachedProviders) {
          this.postToWebview({ type: "providers", providers: this.cachedProviders });
          this.refreshProviderCache(); // refresh for next time
          break;
        }
        // No cache yet — try a fast fetch (3s timeout)
        const port = this.ipc.getPort();
        if (port) {
          try {
            const res = await fetchWithTimeout(
              `http://127.0.0.1:${port}/providers`,
              { method: "POST" },
              3000,
            );
            if (res.ok) {
              const providers = await res.json();
              this.cachedProviders = providers as unknown[];
              this.postToWebview({ type: "providers", providers });
            } else {
              this.postToWebview({ type: "providers", providers: [] });
            }
          } catch {
            this.postToWebview({ type: "providers", providers: [] });
          }
        } else {
          this.postToWebview({ type: "providers", providers: [] });
        }
        break;
      }

      case "get-settings": {
        this.pushSettings();
        break;
      }

      case "set-setting": {
        const cfg = vscode.workspace.getConfiguration("mail-mcp");
        await cfg.update(msg.key as string, msg.value, vscode.ConfigurationTarget.Global);
        break;
      }

      case "get-instructions": {
        const port = this.ipc.getPort();
        if (port) {
          try {
            const res = await fetchWithTimeout(`http://127.0.0.1:${port}/instructions`);
            if (res.ok) {
              const data = await res.json() as { content: string };
              this.postToWebview({ type: "instructions", content: data.content });
            }
          } catch {}
        }
        break;
      }

      case "get-custom-instructions": {
        const cfg = vscode.workspace.getConfiguration("mail-mcp");
        const content = cfg.get<string>("customInstructions", "");
        this.postToWebview({ type: "custom-instructions", content });
        break;
      }

      case "set-custom-instructions": {
        const cfg = vscode.workspace.getConfiguration("mail-mcp");
        await cfg.update("customInstructions", msg.content as string, vscode.ConfigurationTarget.Global);
        // Notify MCP server of updated instructions
        const port2 = this.ipc.getPort();
        if (port2) {
          try {
            await fetchWithTimeout(
              `http://127.0.0.1:${port2}/instructions/custom`,
              { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msg.content }) },
            );
          } catch {}
        }
        break;
      }

      case "add-mcp-config": {
        const client = msg.client as string;
        await this.addMcpConfigForClient(client);
        break;
      }

      case "login": {
        // Trigger device code flow via IPC to MCP server
        const port = this.ipc.getPort();
        if (!port) {
          this.postToWebview({ type: "auth-error", error: "MCP server is not running. Start it first." });
          break;
        }
        try {
          const providerId = msg.providerId as string | undefined;
          const res = await fetchWithTimeout(
            `http://127.0.0.1:${port}/auth/login`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId }) },
            12000,
          );
          if (res.ok) {
            const data = await res.json() as { loggedIn: boolean; pending?: { code: string; uri: string; expiresIn?: number }; error?: string };
            if (data.loggedIn) {
              this.postToWebview({ type: "auth-status", loggedIn: true });
            } else if (data.pending) {
              this.pendingChallenge = data.pending;
              this.postToWebview({ type: "auth-challenge", ...data.pending, source: "button" });
            } else {
              this.postToWebview({ type: "auth-error", error: data.error ?? "Sign in failed." });
            }
          } else {
            this.postToWebview({ type: "auth-error", error: "MCP server returned an error." });
          }
        } catch {
          this.postToWebview({ type: "auth-error", error: "MCP server is not responding. Is it running?" });
        }
        break;
      }

      case "logout": {
        // Logout via IPC to MCP server
        try {
          const port = this.ipc.getPort();
          if (port) {
            await this.ipc.request("/auth/logout");
          }
        } catch { /* best effort */ }
        this.postToWebview({ type: "auth-status", loggedIn: false });
        break;
      }

      case "set-ipc-port": {
        const port = msg.port as number;
        this.ipc.setPort(port);
        break;
      }

      case "get-messages": {
        if (!this.ipc.getPort()) return;
        try {
          const messages = await this.ipc.getMessages(
            msg.folder as string | undefined,
            msg.count as number | undefined
          );
          this.postToWebview({ type: "messages", messages });
        } catch (err) {
          const errStr = String(err);
          if (errStr.includes("IPC port not configured")) return;
          this.postToWebview({ type: "error", error: errStr });
        }
        break;
      }

      case "delete-messages": {
        this.postToWebview({ type: "action-result", action: "delete", results: ["Delete is currently disabled."] });
        break;
      }

      case "move-messages": {
        const moveIds = msg.ids as string[];
        const folder = msg.folder as string;
        const results: string[] = [];
        for (const id of moveIds) {
          try {
            await this.ipc.moveMessage(id, folder);
            results.push(`Moved ${id}`);
          } catch (err) {
            results.push(`Failed to move ${id}: ${err}`);
          }
        }
        this.postToWebview({ type: "action-result", action: "move", results });
        break;
      }

      case "check-unsubscribe": {
        const id = msg.id as string;
        try {
          const info = await this.ipc.getUnsubscribeInfo(id);
          this.postToWebview({ type: "unsubscribe-info", info });
        } catch (err) {
          this.postToWebview({ type: "error", error: String(err) });
        }
        break;
      }

      case "unsubscribe": {
        const unsubIds = msg.ids as string[];
        const results: string[] = [];
        for (const id of unsubIds) {
          try {
            const res = await this.ipc.unsubscribe(id);
            results.push(`${id}: ${(res as { result: string }).result}`);
          } catch (err) {
            results.push(`${id}: Failed — ${err}`);
          }
        }
        this.postToWebview({ type: "action-result", action: "unsubscribe", results });
        break;
      }

      case "get-folders": {
        try {
          const folders = await this.ipc.getFolders();
          this.postToWebview({ type: "folders", folders });
        } catch (err) {
          this.postToWebview({ type: "error", error: String(err) });
        }
        break;
      }

      case "get-reviews": {
        if (!this.ipc.getPort()) return;
        try {
          const reviews = await this.ipc.request("/reviews/pending");
          this.postToWebview({ type: "reviews", reviews });
        } catch { /* IPC not ready */ }
        break;
      }

      case "get-mcp-status": {
        const port = this.ipc.getPort();
        if (port) {
          try {
            const res = await fetchWithTimeout(`http://127.0.0.1:${port}/mcp-status`, { method: "POST" });
            if (res.ok) {
              const serverData = await res.json() as Record<string, unknown>;
              this.postToWebview({ type: "mcp-status", data: { ...serverData, lastMessage: null } });
              return;
            }
          } catch { /* server not responding */ }
        }
        this.postToWebview({
          type: "mcp-status",
          data: {
            status: isServerRunning() ? "starting" : "stopped",
            port: null,
            address: null,
            tools: 0,
            sessions: 0,
            uptime: 0,
            version: "",
            lastMessage: isServerRunning() ? "Server process running, waiting for HTTP..." : null,
          },
        });
        break;
      }

      case "mcp-start": { startMcpServerManual(); break; }
      case "mcp-stop": { stopMcpServer(); this.ipc.setPort(0); break; }
      case "mcp-restart": { restartMcpServer(); break; }

      case "focus-panel": {
        if (vscode.workspace.getConfiguration("mail-mcp").get<boolean>("focusOnReview", true)) {
          await vscode.commands.executeCommand("mail-mcp.panel.focus");
        }
        break;
      }

      case "review-respond": {
        if (!this.ipc.getPort()) return;
        try {
          await this.ipc.request("/reviews/respond", {
            id: msg.id,
            approved: msg.approved,
            selectedIds: msg.selectedIds,
          });
        } catch (err) {
          this.postToWebview({ type: "error", error: String(err) });
        }
        break;
      }
    }
  }

  private async addMcpConfigForClient(client: string) {
    const serverPath = path.resolve(__dirname, "..", "..", "mcp-server", "dist", "index.js");
    const clientId = process.env.MAIL_MCP_CLIENT_ID || "";
    const entry = {
      command: "node",
      args: [serverPath],
      env: clientId ? { MAIL_MCP_CLIENT_ID: clientId } : undefined,
    };

    let configPath: string;
    let configKey: string;

    switch (client) {
      case "vscode": {
        // Write to VS Code settings
        const cfg = vscode.workspace.getConfiguration("mcp");
        const existing = cfg.get<Record<string, unknown>>("servers", {});
        existing["mail-mcp"] = entry;
        await cfg.update("servers", existing, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage("Mail MCP added to VS Code MCP settings.");
        return;
      }
      case "claude": {
        configPath = path.join(os.homedir(), ".config", "claude", "claude_desktop_config.json");
        if (process.platform === "win32") {
          configPath = path.join(os.homedir(), "AppData", "Roaming", "Claude", "claude_desktop_config.json");
        }
        configKey = "mcpServers";
        break;
      }
      case "cursor": {
        configPath = path.join(os.homedir(), ".cursor", "mcp.json");
        configKey = "mcpServers";
        break;
      }
      default:
        return;
    }

    try {
      let config: Record<string, any> = {};
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } else {
        // Create directory if needed
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
      }
      if (!config[configKey]) config[configKey] = {};
      config[configKey]["mail-mcp"] = entry;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      vscode.window.showInformationMessage(`Mail MCP added to ${client} config: ${configPath}`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to write ${client} config: ${err.message}`);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const distUri = vscode.Uri.joinPath(this.extensionUri, "..", "webview", "dist");
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, "index.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, "index.css"));

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src http://127.0.0.1:*;">
  <link rel="stylesheet" href="${styleUri}">
  <title>Mail MCP</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
