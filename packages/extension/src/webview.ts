import * as vscode from "vscode";
import { IpcClient } from "./ipc-client";
import { AuthManager } from "./auth";

export class OutlookWebviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly ipc: IpcClient,
    private readonly auth: AuthManager
  ) {}

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

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      await this.handleMessage(msg);
    });
  }

  postToWebview(message: unknown) {
    this.view?.webview.postMessage(message);
  }

  private async handleMessage(msg: { type: string; [key: string]: unknown }) {
    switch (msg.type) {
      case "ready": {
        const loggedIn = await this.auth.isLoggedIn();
        this.postToWebview({ type: "auth-status", loggedIn });
        break;
      }

      case "login": {
        try {
          // Try silent first
          const silent = await this.auth.acquireTokenSilent();
          if (silent) {
            this.postToWebview({ type: "auth-status", loggedIn: true });
            return;
          }

          // Fall back to device code
          const { userCode, verificationUri, tokenPromise } =
            await this.auth.acquireTokenByDeviceCode();

          this.postToWebview({
            type: "device-code",
            userCode,
            verificationUri,
          });

          // Open the URL in external browser
          await vscode.env.openExternal(vscode.Uri.parse(verificationUri));

          await tokenPromise;
          this.postToWebview({ type: "auth-status", loggedIn: true });
          vscode.window.showInformationMessage("Outlook MCP: Signed in successfully!");
        } catch (err) {
          this.postToWebview({ type: "auth-error", error: String(err) });
        }
        break;
      }

      case "logout": {
        await this.auth.logout();
        this.postToWebview({ type: "auth-status", loggedIn: false });
        break;
      }

      case "set-ipc-port": {
        const port = msg.port as number;
        this.ipc.setPort(port);
        break;
      }

      case "get-messages": {
        try {
          const messages = await this.ipc.getMessages(
            msg.folder as string | undefined,
            msg.count as number | undefined
          );
          this.postToWebview({ type: "messages", messages });
        } catch (err) {
          this.postToWebview({ type: "error", error: String(err) });
        }
        break;
      }

      case "delete-messages": {
        const ids = msg.ids as string[];
        const results: string[] = [];
        for (const id of ids) {
          try {
            await this.ipc.deleteMessage(id);
            results.push(`Deleted ${id}`);
          } catch (err) {
            results.push(`Failed to delete ${id}: ${err}`);
          }
        }
        this.postToWebview({ type: "action-result", action: "delete", results });
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
    }
  }

  private getHtml(webview: vscode.Webview): string {
    // Try to load the built React app
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
  <title>Outlook MCP</title>
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
