import * as vscode from "vscode";

const MCP_PORT = 3101;

export class McpRegistration {
  private readonly onChanged = new vscode.EventEmitter<void>();
  private enabled = true;

  register(context: vscode.ExtensionContext): void {
    const self = this;
    const provider: vscode.McpServerDefinitionProvider<vscode.McpHttpServerDefinition> = {
      onDidChangeMcpServerDefinitions: this.onChanged.event,
      provideMcpServerDefinitions() {
        if (!self.enabled) return [];
        return [
          new vscode.McpHttpServerDefinition(
            "Mail",
            vscode.Uri.parse(`http://127.0.0.1:${MCP_PORT}/mcp`),
          ),
        ];
      },
    };

    context.subscriptions.push(
      this.onChanged,
      vscode.lm.registerMcpServerDefinitionProvider("mail-mcp.server", provider),
    );
  }

  /** Signal VS Code to tear down and recreate the MCP session. */
  notifyChanged(): void {
    // Toggle off then back on to force VS Code to drop the old session
    this.enabled = false;
    this.onChanged.fire();
    setTimeout(() => {
      this.enabled = true;
      this.onChanged.fire();
    }, 500);
  }
}
