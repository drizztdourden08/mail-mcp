import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const emailList: ToolDefinition = {
  name: "email.list",
  description: "List recent emails from a folder. Returns a summary of each email with ID, subject, sender, and date.",
  schema: {
    folder: z.string().optional().describe("Folder to list (default: Inbox). Accepts display names or IDs."),
    count: z.number().optional().describe("Number of emails to fetch (1-50, default 20)"),
  },
  async handler({ folder, count }, { mail }) {
    const messages = await mail.listMessages(folder ?? "Inbox", Math.min(Math.max(count ?? 20, 1), 50));
    const lines = messages.map((m, i) => {
      const date = new Date(m.date).toLocaleDateString();
      const read = m.isRead ? "" : "\uD83D\uDD35 ";
      return `${i + 1}. ${read}**${m.subject}**\n   From: ${m.from.email} | ${date}\n   ${m.preview.slice(0, 100)}...\n   ID: \`${m.id}\``;
    });
    return { content: [{ type: "text", text: lines.join("\n\n") || "No messages found." }] };
  },
};
