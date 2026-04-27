import * as vscode from "vscode";
import type { IpcClient } from "./ipc-client";

export interface AuthChallenge {
  code: string;
  uri: string;
  source: string;
}

export class AuthBridge {
  private interval?: ReturnType<typeof setInterval>;
  private lastSeenCode: string | null = null;
  private lastReportedLoggedIn: boolean | null = null;

  constructor(
    private readonly ipcClient: IpcClient,
    private readonly onAuthStatusChange: (loggedIn: boolean) => void,
    private readonly onAuthChallenge: (challenge: AuthChallenge) => void,
  ) {}

  startPolling(context: vscode.ExtensionContext): void {
    const poll = async () => {
      const port = this.ipcClient.getPort();
      if (!port) return;

      try {
        const res = await fetch(`http://127.0.0.1:${port}/auth/status`, { method: "POST" });
        if (!res.ok) return;
        const data = await res.json() as {
          loggedIn: boolean;
          pending: { code: string; uri: string } | null;
        };

        if (data.loggedIn !== this.lastReportedLoggedIn) {
          this.lastReportedLoggedIn = data.loggedIn;
          this.onAuthStatusChange(data.loggedIn);
          if (data.loggedIn) { this.lastSeenCode = null; return; }
        }

        if (data.loggedIn) { this.lastSeenCode = null; return; }
        if (!data.pending) { this.lastSeenCode = null; return; }
        if (data.pending.code === this.lastSeenCode) return;

        this.lastSeenCode = data.pending.code;
        const cfg = vscode.workspace.getConfiguration("mail-mcp");

        this.onAuthChallenge({
          code: data.pending.code,
          uri: data.pending.uri,
          source: "mcp",
        });

        if (cfg.get<boolean>("autoCopyCode", true)) {
          await vscode.env.clipboard.writeText(data.pending.code);
        }
        if (cfg.get<boolean>("autoOpenBrowser", true)) {
          vscode.env.openExternal(vscode.Uri.parse(data.pending.uri)).then(undefined, () => {});
        }
      } catch { /* IPC not ready */ }
    };

    this.interval = setInterval(poll, 2000);
    context.subscriptions.push({ dispose: () => this.stopPolling() });
  }

  stopPolling(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
