import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";
import type { FolderTreeNode } from "../../types/mail.js";

function formatTree(nodes: FolderTreeNode[], indent: number = 0): string {
  return nodes.map((n) => {
    const pad = "  ".repeat(indent);
    const childCount = n.children.length > 0 ? ` [${n.children.length} subfolders]` : "";
    const line = `${pad}• **${n.displayName}** — ${n.totalItemCount} total, ${n.unreadItemCount} unread${childCount}\n${pad}  ID: \`${n.id}\``;
    if (n.children.length > 0) {
      return line + "\n" + formatTree(n.children, indent + 1);
    }
    return line;
  }).join("\n");
}

export const folderTree: ToolDefinition = {
  name: "folder.tree",
  description: "List the full mailbox folder tree with parent-child relationships, item counts, and IDs. Use this when the user asks about mailbox structure.",
  schema: {},
  async handler(_params, { mail }) {
    const tree = await mail.listFolderHierarchy();
    const text = formatTree(tree);
    return { content: [{ type: "text", text: text || "No folders found." }] };
  },
};
