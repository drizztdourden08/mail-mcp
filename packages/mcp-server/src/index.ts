import { join } from "node:path";
import { homedir } from "node:os";

import { IpcServer } from "./services/ipc-server.js";
import { ReviewManager } from "./services/review-manager.js";
import { McpSessionManager } from "./services/mcp-session-manager.js";
import { ProviderRegistry } from "./services/provider-registry.js";
import { createToolRegistry } from "./tools/index.js";
import { MsalAuthProvider } from "./providers/exchange/auth/index.js";
import { ExchangeMailProvider } from "./providers/exchange/mail/index.js";
import { EXCHANGE_PROVIDER_INFO, isExchangeConfigured } from "./providers/exchange/provider-info.js";
import { MemoryStoreProvider } from "./store/memory/index.js";
import { registerIpcRoutes } from "./ipc-routes.js";
import { MCP_INSTRUCTIONS } from "./instructions.js";
import type { AuthToolState, ToolContext } from "./types/tool.js";

const CONFIG_DIR = join(homedir(), ".mail-mcp");
const PORT_FILE = join(CONFIG_DIR, "ipc-port");
const CACHE_FILE = join(CONFIG_DIR, "token_cache.json");

function getClientId(): string {
  const id = process.env.MAIL_MCP_CLIENT_ID;
  if (!id) throw new Error("MAIL_MCP_CLIENT_ID environment variable is required");
  return id;
}

async function main() {
  // Provider registry
  const providerRegistry = new ProviderRegistry();
  providerRegistry.register({ ...EXCHANGE_PROVIDER_INFO, isConfigured: isExchangeConfigured() });

  // Providers
  const auth = new MsalAuthProvider(getClientId(), CACHE_FILE);
  const mail = new ExchangeMailProvider(auth);
  const store = new MemoryStoreProvider();

  // Services
  const reviews = new ReviewManager();
  const toolRegistry = createToolRegistry();
  const authState: AuthToolState = { pendingAuth: null, authResolve: null };

  const ctx: ToolContext = { auth, mail, store, reviews, authState };
  const sessions = new McpSessionManager(toolRegistry, ctx, MCP_INSTRUCTIONS);

  // IPC
  const ipc = new IpcServer(PORT_FILE);
  registerIpcRoutes(ipc, auth, mail, reviews, sessions, authState, providerRegistry, toolRegistry.getCount());
  await ipc.start();

  process.stderr.write(
    `[mail-mcp] MCP server ready on http://127.0.0.1:${ipc.getPort()}/mcp ` +
    `(${toolRegistry.getCount()} tools)\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[mail-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
