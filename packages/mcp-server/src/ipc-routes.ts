import { z } from "zod";
import type { IpcServer } from "./services/ipc-server.js";
import type { ReviewManager } from "./services/review-manager.js";
import type { McpSessionManager } from "./services/mcp-session-manager.js";
import type { ProviderRegistry } from "./services/provider-registry.js";
import type { AuthProvider } from "./providers/auth.js";
import type { MailProvider } from "./providers/mail.js";
import type { AuthToolState } from "./types/tool.js";
import { MCP_INSTRUCTIONS } from "./instructions.js";

// ── IPC request schemas ──────────────────────────────────────

const CustomInstructionsBody = z.object({ content: z.string().optional() });
const MessagesBody = z.object({ folder: z.string().optional(), count: z.number().int().positive().optional() });
const IdBody = z.object({ id: z.string().min(1) });
const MoveBody = z.object({ id: z.string().min(1), folder: z.string().min(1) });

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  return schema.parse(body);
}

export function registerIpcRoutes(
  ipc: IpcServer,
  auth: AuthProvider,
  mail: MailProvider,
  reviews: ReviewManager,
  sessions: McpSessionManager,
  authState: AuthToolState,
  providerRegistry: ProviderRegistry,
  toolCount: number,
): void {
  // Provider registry
  ipc.registerHandler("/providers", async () => providerRegistry.getAll());

  // Instructions
  ipc.registerHandler("/instructions", async () => ({ content: MCP_INSTRUCTIONS }));

  ipc.registerHandler("/instructions/custom", async (body: unknown) => {
    const { content } = parse(CustomInstructionsBody, body);
    sessions.setCustomInstructions(content ?? "");
    return { ok: true };
  });

  // Auth
  ipc.registerHandler("/status", async () => ({
    loggedIn: await auth.isLoggedIn(),
    port: ipc.getPort(),
  }));

  ipc.registerHandler("/auth/status", async () => ({
    loggedIn: await auth.isLoggedIn(),
    pending: authState.pendingAuth,
  }));

  ipc.registerHandler("/auth/logout", async () => {
    await auth.logout();
    return { loggedIn: false };
  });

  ipc.registerHandler("/auth/login", async () => {
    const loggedIn = await auth.isLoggedIn();
    if (loggedIn) {
      try {
        await auth.getAccessToken();
        return { loggedIn: true };
      } catch { /* token expired, fall through */ }
    }

    // Start device code flow (non-blocking — AuthBridge will pick up the challenge)
    authState.pendingAuth = null;
    auth.getAccessToken((info) => {
      authState.pendingAuth = { code: info.code, uri: info.uri, expiresIn: info.expiresIn };
      if (authState.authResolve) {
        authState.authResolve();
        authState.authResolve = null;
      }
    }).then(() => {
      authState.pendingAuth = null;
    }).catch(() => {
      authState.pendingAuth = null;
    });

    // Wait up to 10s for the challenge to appear
    if (!authState.pendingAuth) {
      await Promise.race([
        new Promise<void>((r) => { authState.authResolve = r; }),
        new Promise<void>((_, r) => setTimeout(() => r(new Error("timeout")), 10000)),
      ]).catch(() => {});
    }

    if (authState.pendingAuth) {
      return { loggedIn: false, pending: authState.pendingAuth };
    }
    return { loggedIn: false, error: "Failed to start device code flow" };
  });

  // Mail
  ipc.registerHandler("/messages", async (body: unknown) => {
    const { folder, count } = parse(MessagesBody, body);
    return mail.listMessages(folder ?? "Inbox", count ?? 20);
  });

  ipc.registerHandler("/message", async (body: unknown) => {
    const { id } = parse(IdBody, body);
    return mail.getMessage(id);
  });

  ipc.registerHandler("/delete", async (body: unknown) => {
    const { id } = parse(IdBody, body);
    return mail.deleteMessage(id);
  });

  ipc.registerHandler("/move", async (body: unknown) => {
    const { id, folder } = parse(MoveBody, body);
    return mail.moveMessage(id, folder);
  });

  ipc.registerHandler("/unsubscribe-info", async (body: unknown) => {
    const { id } = parse(IdBody, body);
    return mail.getUnsubscribeInfo(id);
  });

  ipc.registerHandler("/unsubscribe", async (body: unknown) => {
    const { id } = parse(IdBody, body);
    const info = await mail.getUnsubscribeInfo(id);
    const result = await mail.executeUnsubscribe(info);
    return { result };
  });

  ipc.registerHandler("/folders", async () => mail.listFolders());

  // Reviews (delegates to ReviewManager)
  reviews.registerIpcHandlers(ipc);

  // MCP session management
  ipc.registerMcpHandler((req, res, body) => sessions.handleRequest(req, res, body));

  // Server status
  const SERVER_START_TIME = Date.now();
  ipc.registerHandler("/mcp-status", async () => ({
    status: "running",
    port: ipc.getPort(),
    address: `http://127.0.0.1:${ipc.getPort()}/mcp`,
    tools: toolCount,
    sessions: sessions.getSessionCount(),
    uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    version: "0.1.0",
  }));
}
