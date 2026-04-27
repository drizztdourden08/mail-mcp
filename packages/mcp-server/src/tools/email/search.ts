import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const emailSearch: ToolDefinition = {
  name: "email.search",
  description: "Search emails by keyword via the mail API. For large result sets, use cache.sync + cache.search instead.",
  schema: {
    query: z.string().describe("Search query (searches subject, body, sender)"),
    count: z.number().optional().describe("Max results (1-50, default 10)"),
  },
  async handler({ query, count }, { mail }) {
    const messages = await mail.searchMessages(query, Math.min(Math.max(count ?? 10, 1), 50));
    const lines = messages.map((m, i) => {
      return `${i + 1}. **${m.subject}** — ${m.from.email}\n   ${m.preview.slice(0, 100)}...\n   ID: \`${m.id}\``;
    });
    return { content: [{ type: "text", text: lines.join("\n\n") || "No results." }] };
  },
};
