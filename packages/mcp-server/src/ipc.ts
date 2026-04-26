import http from "node:http";

type RequestHandler = (body: unknown) => Promise<unknown>;

const handlers = new Map<string, RequestHandler>();
let server: http.Server | null = null;
let serverPort: number | null = null;

export function registerHandler(route: string, handler: RequestHandler): void {
  handlers.set(route, handler);
}

export function getIpcPort(): number | null {
  return serverPort;
}

export async function startIpcServer(): Promise<number> {
  if (server) return serverPort!;

  return new Promise((resolve, reject) => {
    server = http.createServer(async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const route = req.url ?? "/";
      const handler = handlers.get(route);

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

    server.listen(0, "127.0.0.1", () => {
      const addr = server!.address();
      if (typeof addr === "object" && addr) {
        serverPort = addr.port;
        process.stderr.write(`[outlook-mcp] IPC server on port ${serverPort}\n`);
        resolve(serverPort);
      } else {
        reject(new Error("Failed to start IPC server"));
      }
    });

    server.on("error", reject);
  });
}

export async function stopIpcServer(): Promise<void> {
  if (!server) return;
  return new Promise((resolve) => {
    server!.close(() => {
      server = null;
      serverPort = null;
      resolve();
    });
  });
}
