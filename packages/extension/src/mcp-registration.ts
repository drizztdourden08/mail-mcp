import * as vscode from "vscode";

const MCP_PORT = 3101;

export class McpRegistration {
  private readonly onChanged = new vscode.EventEmitter<void>();

  register(context: vscode.ExtensionContext): void {
    const provider: vscode.McpServerDefinitionProvider<vscode.McpHttpServerDefinition> = {
      onDidChangeMcpServerDefinitions: this.onChanged.event,
      provideMcpServerDefinitions() {
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

  notifyChanged(): void {
    this.onChanged.fire();
  }
}
