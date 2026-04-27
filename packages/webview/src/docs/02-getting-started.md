# Getting Started

## Quick Start

1. Install the **Mail MCP** extension in VS Code.
2. Open the Mail MCP sidebar panel (activity bar icon).
3. Navigate to **Docs → Provider Setup** and follow the setup guide for your email provider.
4. Click **Connect** on the Connect tab and complete the sign-in flow.
5. Add the MCP server to your AI client configuration (see below).

## MCP Client Configuration

Add this to your MCP client config:

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "mail-mcp": {
      "command": "node",
      "args": ["path/to/packages/mcp-server/out/index.js"],
      "env": {
        "MAIL_MCP_CLIENT_ID": "your-provider-client-id"
      }
    }
  }
}
```

**VS Code (Copilot / MCP extension)**:
```json
{
  "mcp": {
    "servers": {
      "mail-mcp": {
        "command": "node",
        "args": ["path/to/packages/mcp-server/out/index.js"],
        "env": {
          "MAIL_MCP_CLIENT_ID": "your-provider-client-id"
        }
      }
    }
  }
}
```

> **Tip:** Check the Settings tab for a button to auto-configure your AI client.

## Requirements

- Node.js 18+
- VS Code 1.96+
- A configured email provider (see Provider Setup)
