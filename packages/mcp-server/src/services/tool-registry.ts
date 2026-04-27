import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolDefinition, ToolContext } from "../types/tool.js";

const AUTH_TOOLS = new Set(["auth.login", "auth.logout"]);

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  registerAll(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  getCount(): number {
    return this.tools.size;
  }

  getNames(): string[] {
    return [...this.tools.keys()];
  }

  bindToServer(server: McpServer, ctx: ToolContext): void {
    for (const tool of this.tools.values()) {
      const handler = AUTH_TOOLS.has(tool.name)
        ? (params: any) => tool.handler(params, ctx)
        : async (params: any) => {
            const loggedIn = await ctx.auth.isLoggedIn();
            if (!loggedIn) {
              return {
                content: [{ type: "text" as const, text: "Not signed in. Please use auth.login first." }],
                isError: true,
              };
            }
            return tool.handler(params, ctx);
          };

      server.tool(tool.name, tool.description, tool.schema, handler);
    }
  }
}
