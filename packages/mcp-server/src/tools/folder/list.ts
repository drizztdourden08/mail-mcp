import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const folderList: ToolDefinition = {
  name: "folder.list",
  description: "List your top-level mail folders with IDs, display names, and item counts.",
  schema: {},
  async handler(_params, { mail }) {
    const folders = await mail.listFolders();
    const lines = folders.map(
      (f) => `• **${f.displayName}** — ${f.totalItemCount} total, ${f.unreadItemCount} unread (ID: \`${f.id}\`)`
    );
    return { content: [{ type: "text", text: lines.join("\n") || "No folders found." }] };
  },
};
