import * as vscode from "vscode";
import { OutlookWebviewProvider } from "./webview";
import { IpcClient } from "./ipc-client";
import { AuthManager } from "./auth";

let ipcClient: IpcClient;
let authManager: AuthManager;

export function activate(context: vscode.ExtensionContext) {
  authManager = new AuthManager(context);
  ipcClient = new IpcClient();

  const webviewProvider = new OutlookWebviewProvider(
    context.extensionUri,
    ipcClient,
    authManager
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("outlook-mcp.panel", webviewProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("outlook-mcp.login", async () => {
      webviewProvider.postToWebview({ type: "navigate", view: "login" });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("outlook-mcp.openPanel", async () => {
      // Focus the sidebar
      await vscode.commands.executeCommand("outlook-mcp.panel.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("outlook-mcp.reviewInbox", async () => {
      webviewProvider.postToWebview({ type: "navigate", view: "inbox-review" });
      await vscode.commands.executeCommand("outlook-mcp.panel.focus");
    })
  );

  // Try to discover MCP server's IPC port from recent stderr output
  discoverIpcPort(context);
}

async function discoverIpcPort(context: vscode.ExtensionContext) {
  // The IPC port is stored by the MCP server. Poll for it.
  const stored = context.workspaceState.get<number>("outlook-mcp.ipcPort");
  if (stored) {
    ipcClient.setPort(stored);
  }

  // Also check periodically in case MCP server restarts
  const interval = setInterval(async () => {
    try {
      const port = ipcClient.getPort();
      if (port) {
        const res = await fetch(`http://127.0.0.1:${port}/status`);
        if (res.ok) return; // Still alive
      }
    } catch {
      // Port no longer valid
    }
    // Try known port range or wait for user to set it
  }, 30000);

  context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

export function deactivate() {
  // Cleanup
}
