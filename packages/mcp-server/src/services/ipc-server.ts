import http from "node:http";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

type IpcHandler = (body: unknown) => Promise<unknown>;
type McpHandler = (req: http.IncomingMessage, res: http.ServerResponse, body?: unknown) => Promise<void>;

export class IpcServer {
  private handlers = new Map<string, IpcHandler>();
  private mcpHandler?: McpHandler;
  private server?: http.Server;
  private port?: number;

  constructor(private portFilePath: string, private defaultPort = 3101) {}

  registerHandler(route: string, handler: IpcHandler): void {
    this.handlers.set(route, handler);
  }

  registerMcpHandler(handler: McpHandler): void {
    this.mcpHandler = handler;
  }

  getPort(): number | undefined {
    return this.port;
  }

  async start(preferredPort?: number): Promise<number> {
    if (this.server) return this.port!;

    const port = preferredPort
      ?? (parseInt(process.env.MAIL_MCP_PORT || "", 10) || this.defaultPort);

    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, MCP-Session-Id, MCP-Protocol-Version");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        const route = req.url ?? "/";

        // Route /mcp to the MCP Streamable HTTP transport
        if (route === "/mcp" && this.mcpHandler) {
          try {
            if (req.method === "POST") {
              const chunks: Buffer[] = [];
              for await (const chunk of req) chunks.push(chunk as Buffer);
              const bodyStr = Buffer.concat(chunks).toString();
              const body = bodyStr ? JSON.parse(bodyStr) : undefined;
              await this.mcpHandler(req, res, body);
            } else {
              await this.mcpHandler(req, res);
            }
          } catch {
            if (!res.headersSent) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32603, message: "Internal server error" },
                id: null,
              }));
            }
          }
          return;
        }

        // IPC routes
        const handler = this.handlers.get(route);
        if (!handler) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const bodyStr = Buffer.concat(chunks).toString();
          const body = bodyStr ? JSON.parse(bodyStr) : {};
          const result = await handler(body);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      this.server.listen(port, "127.0.0.1", async () => {
        const addr = this.server!.address();
        if (typeof addr === "object" && addr) {
          this.port = addr.port;
          process.stderr.write(`[mcp] HTTP server on port ${this.port}\n`);
          try {
            await mkdir(dirname(this.portFilePath), { recursive: true });
            await writeFile(this.portFilePath, String(this.port), "utf-8");
          } catch {
            // Non-fatal
          }
          resolve(this.port);
        } else {
          reject(new Error("Failed to start HTTP server"));
        }
      });

      this.server.on("error", reject);
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    return new Promise((resolve) => {
      this.server!.close(() => {
        this.server = undefined;
        this.port = undefined;
        resolve();
      });
    });
  }
}
