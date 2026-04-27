import * as vscode from "vscode";
import { OutlookWebviewProvider } from "./webview";
import { IpcClient } from "./ipc-client";
import { ServerManager } from "./server-manager";
import { AuthBridge } from "./auth-bridge";
import { McpRegistration } from "./mcp-registration";

let serverManager: ServerManager;
let mcpRegistration: McpRegistration;

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("Mail MCP");
  context.subscriptions.push(outputChannel);

  const ipcClient = new IpcClient();
  serverManager = new ServerManager(context, ipcClient, outputChannel);
  mcpRegistration = new McpRegistration();

  const webviewProvider = new OutlookWebviewProvider(
    context.extensionUri,
    ipcClient,
  );

  // Webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("mail-mcp.panel", webviewProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("mail-mcp.login", () => {
      webviewProvider.postToWebview({ type: "navigate", view: "login" });
    }),
    vscode.commands.registerCommand("mail-mcp.openPanel", () => {
      vscode.commands.executeCommand("mail-mcp.panel.focus");
    }),
    vscode.commands.registerCommand("mail-mcp.reviewInbox", () => {
      webviewProvider.postToWebview({ type: "navigate", view: "inbox-review" });
      vscode.commands.executeCommand("mail-mcp.panel.focus");
    }),
    vscode.commands.registerCommand("mail-mcp.startServer", () => serverManager.start()),
    vscode.commands.registerCommand("mail-mcp.stopServer", () => serverManager.stop()),
    vscode.commands.registerCommand("mail-mcp.restartServer", () => serverManager.restart()),
  );

  // Auth polling
  const authBridge = new AuthBridge(
    ipcClient,
    (loggedIn) => webviewProvider.postToWebview({ type: "auth-status", loggedIn }),
    (code) => {
      vscode.commands.executeCommand("outlook-mcp.panel.focus");
      webviewProvider.postToWebview({ type: "auth-challenge", ...code });
    },
  );
  authBridge.startPolling(context);

  // Server lifecycle
  serverManager.autoStart();
  serverManager.discoverPort(async (port) => {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/auth/status`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { loggedIn: boolean };
        webviewProvider.postToWebview({ type: "auth-status", loggedIn: data.loggedIn });
      }
    } catch { /* ignore */ }
    webviewProvider.postToWebview({ type: "ipc-ready" });
    webviewProvider.refreshProviderCache();
    webviewProvider.syncCustomInstructionsToServer(port);
    mcpRegistration.notifyChanged();
  });

  // MCP provider
  mcpRegistration.register(context);
}

// Exported for webview message handlers
export function stopMcpServer(): void { serverManager.stop(); }
export function startMcpServerManual(): void {
  serverManager.start();
  setTimeout(() => mcpRegistration.notifyChanged(), 2000);
}
export function restartMcpServer(): void { serverManager.restart(); }
export function isServerRunning(): boolean { return serverManager.isRunning(); }
export function notifyMcpServerChanged(): void { mcpRegistration.notifyChanged(); }

export function deactivate() {
  // ServerManager disposes via context.subscriptions
}
