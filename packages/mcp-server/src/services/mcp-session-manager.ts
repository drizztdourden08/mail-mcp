import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import type http from "node:http";
import type { ToolRegistry } from "./tool-registry.js";
import type { ToolContext } from "../types/tool.js";

export class McpSessionManager {
  private transports = new Map<string, StreamableHTTPServerTransport>();
  private customInstructions = "";

  constructor(
    private registry: ToolRegistry,
    private context: ToolContext,
    private instructions: string,
  ) {}

  setCustomInstructions(custom: string): void {
    this.customInstructions = custom;
  }

  getSessionCount(): number {
    return this.transports.size;
  }

  async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    parsedBody?: unknown,
  ): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (req.method === "GET") {
      if (!sessionId || !this.transports.has(sessionId)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Invalid or missing session ID" }, id: null }));
        return;
      }
      await this.transports.get(sessionId)!.handleRequest(req, res);
      return;
    }

    if (req.method === "DELETE") {
      if (sessionId && this.transports.has(sessionId)) {
        await this.transports.get(sessionId)!.handleRequest(req, res);
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Invalid session" }, id: null }));
      }
      return;
    }

    if (sessionId && this.transports.has(sessionId)) {
      await this.transports.get(sessionId)!.handleRequest(req, res, parsedBody);
      return;
    }

    if (!sessionId && isInitializeRequest(parsedBody)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid: string) => {
          this.transports.set(sid, transport);
          process.stderr.write(`[mcp] Session initialized: ${sid}\n`);
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && this.transports.has(sid)) {
          this.transports.delete(sid);
          process.stderr.write(`[mcp] Session closed: ${sid}\n`);
        }
      };

      const server = this.createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, parsedBody);
      return;
    }

    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: No valid session ID provided" },
      id: null,
    }));
  }

  private createServer(): McpServer {
    let fullInstructions = this.instructions;
    if (this.customInstructions.trim()) {
      fullInstructions += "\n\n## User Custom Instructions (PRIORITY)\n" +
        "The following are custom instructions from the user. If they contradict any default instruction above, " +
        "the user's instructions take priority.\n\n" + this.customInstructions;
    }
    const server = new McpServer(
      { name: "mail-mcp", version: "0.1.0" },
      { instructions: fullInstructions },
    );
    this.registry.bindToServer(server, this.context);
    return server;
  }
}
