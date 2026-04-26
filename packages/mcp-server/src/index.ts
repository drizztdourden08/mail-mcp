import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  listMessages,
  getMessage,
  deleteMessage,
  moveMessage,
  listFolders,
  searchMessages,
  getUnsubscribeInfo,
  executeUnsubscribe,
} from "./graph.js";
import { getAccessToken, isLoggedIn, logout, type DeviceCodeInfo } from "./auth.js";
import { startIpcServer, registerHandler, getIpcPort } from "./ipc.js";

const server = new McpServer({
  name: "outlook",
  version: "0.1.0",
});

// --- Tools ---

server.tool("login", "Sign in to your Microsoft account", {}, async () => {
  const loggedIn = await isLoggedIn();
  if (loggedIn) {
    // Try to silently refresh
    try {
      await getAccessToken();
      return { content: [{ type: "text", text: "Already signed in. Token is valid." }] };
    } catch {
      // Token expired, fall through to device code
    }
  }

  let deviceCodeInfo: DeviceCodeInfo | null = null;
  const tokenPromise = getAccessToken((info) => {
    deviceCodeInfo = info;
  });

  // Wait briefly for the device code callback to fire
  await new Promise((r) => setTimeout(r, 500));

  if (!deviceCodeInfo) {
    return { content: [{ type: "text", text: "Authentication in progress... please wait." }] };
  }

  // Notify extension via IPC if available
  const port = getIpcPort();
  if (port) {
    try {
      await fetch(`http://127.0.0.1:${port}/auth/device-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deviceCodeInfo),
      }).catch(() => {});
    } catch {
      // Extension not listening — fall back to text
    }
  }

  // Wait for user to complete auth
  try {
    await tokenPromise;
    return { content: [{ type: "text", text: "Successfully signed in!" }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Sign in failed: ${err}` }] };
  }
});

server.tool("logout", "Sign out of your Microsoft account", {}, async () => {
  await logout();
  return { content: [{ type: "text", text: "Signed out successfully." }] };
});

server.tool(
  "list_inbox",
  "List recent emails in your inbox",
  { count: z.number().min(1).max(50).default(20).describe("Number of emails to fetch") },
  async ({ count }) => {
    const messages = await listMessages("Inbox", count);
    const lines = messages.map((m, i) => {
      const from = m.from?.emailAddress?.address ?? "unknown";
      const date = new Date(m.receivedDateTime).toLocaleDateString();
      const read = m.isRead ? "" : "🔵 ";
      return `${i + 1}. ${read}**${m.subject}**\n   From: ${from} | ${date}\n   ${m.bodyPreview.slice(0, 100)}...\n   ID: \`${m.id}\``;
    });
    return { content: [{ type: "text", text: lines.join("\n\n") || "No messages found." }] };
  }
);

server.tool(
  "read_message",
  "Read the full content of an email by ID",
  { id: z.string().describe("Message ID") },
  async ({ id }) => {
    const msg = await getMessage(id);
    const from = msg.from?.emailAddress?.address ?? "unknown";
    const body = msg.body?.contentType === "text"
      ? msg.body.content
      : msg.body?.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";

    const text = [
      `**Subject:** ${msg.subject}`,
      `**From:** ${from}`,
      `**Date:** ${msg.receivedDateTime}`,
      `**Read:** ${msg.isRead}`,
      "",
      body,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

server.tool(
  "delete_message",
  "Delete an email by ID",
  { id: z.string().describe("Message ID") },
  async ({ id }) => {
    await deleteMessage(id);
    return { content: [{ type: "text", text: `Message deleted.` }] };
  }
);

server.tool(
  "move_message",
  "Move an email to a different folder",
  {
    id: z.string().describe("Message ID"),
    folder: z.string().describe("Destination folder name or ID (e.g. 'Archive', 'DeletedItems', 'Junk')"),
  },
  async ({ id, folder }) => {
    const moved = await moveMessage(id, folder);
    return { content: [{ type: "text", text: `Message moved. New ID: ${moved.id}` }] };
  }
);

server.tool(
  "list_folders",
  "List your mail folders",
  {},
  async () => {
    const folders = await listFolders();
    const lines = folders.map(
      (f) => `• **${f.displayName}** — ${f.totalItemCount} total, ${f.unreadItemCount} unread (ID: \`${f.id}\`)`
    );
    return { content: [{ type: "text", text: lines.join("\n") || "No folders found." }] };
  }
);

server.tool(
  "search_messages",
  "Search emails by keyword",
  {
    query: z.string().describe("Search query (searches subject, body, sender)"),
    count: z.number().min(1).max(50).default(10).describe("Max results"),
  },
  async ({ query, count }) => {
    const messages = await searchMessages(query, count);
    const lines = messages.map((m, i) => {
      const from = m.from?.emailAddress?.address ?? "unknown";
      return `${i + 1}. **${m.subject}** — ${from}\n   ${m.bodyPreview.slice(0, 100)}...\n   ID: \`${m.id}\``;
    });
    return { content: [{ type: "text", text: lines.join("\n\n") || "No results." }] };
  }
);

server.tool(
  "check_unsubscribe",
  "Check if an email supports unsubscribe",
  { id: z.string().describe("Message ID") },
  async ({ id }) => {
    const info = await getUnsubscribeInfo(id);
    const lines = [
      `**Subject:** ${info.subject}`,
      `**From:** ${info.from}`,
      `**List-Unsubscribe:** ${info.listUnsubscribe ?? "Not found"}`,
      `**One-Click:** ${info.hasOneClick ? "Yes ✓" : "No"}`,
      `**HTTP URL:** ${info.httpUrl ?? "None"}`,
      `**Mailto:** ${info.mailtoUrl ?? "None"}`,
    ];
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "unsubscribe",
  "Unsubscribe from a mailing list",
  { id: z.string().describe("Message ID") },
  async ({ id }) => {
    const info = await getUnsubscribeInfo(id);
    if (!info.listUnsubscribe) {
      return { content: [{ type: "text", text: "This message does not have unsubscribe headers." }] };
    }
    const result = await executeUnsubscribe(info);
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  "get_ipc_port",
  "Get the IPC server port for extension communication",
  {},
  async () => {
    const port = getIpcPort();
    return { content: [{ type: "text", text: port ? String(port) : "IPC server not running" }] };
  }
);

// --- Start ---

async function main() {
  await startIpcServer();

  // Register IPC handlers for extension communication
  registerHandler("/status", async () => ({
    loggedIn: await isLoggedIn(),
    port: getIpcPort(),
  }));

  registerHandler("/messages", async (body: unknown) => {
    const { folder, count } = body as { folder?: string; count?: number };
    return listMessages(folder ?? "Inbox", count ?? 20);
  });

  registerHandler("/message", async (body: unknown) => {
    const { id } = body as { id: string };
    return getMessage(id);
  });

  registerHandler("/delete", async (body: unknown) => {
    const { id } = body as { id: string };
    await deleteMessage(id);
    return { ok: true };
  });

  registerHandler("/move", async (body: unknown) => {
    const { id, folder } = body as { id: string; folder: string };
    return moveMessage(id, folder);
  });

  registerHandler("/unsubscribe-info", async (body: unknown) => {
    const { id } = body as { id: string };
    return getUnsubscribeInfo(id);
  });

  registerHandler("/unsubscribe", async (body: unknown) => {
    const { id } = body as { id: string };
    const info = await getUnsubscribeInfo(id);
    const result = await executeUnsubscribe(info);
    return { result };
  });

  registerHandler("/folders", async () => listFolders());

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[outlook-mcp] MCP server started on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`[outlook-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
