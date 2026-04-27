import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const cacheFilter: ToolDefinition = {
  name: "cache.filter",
  description: "Filter cached messages by criteria. No API calls. Use hasUnsubscribe=true to find all unsubscribable emails instantly.",
  schema: {
    hasUnsubscribe: z.boolean().optional().describe("Filter by unsubscribe header presence"),
    isRead: z.boolean().optional().describe("Filter by read status"),
    fromPattern: z.string().optional().describe("Filter by sender (substring match)"),
    afterDate: z.string().optional().describe("Only messages after this ISO date"),
    beforeDate: z.string().optional().describe("Only messages before this ISO date"),
  },
  async handler(opts, { store }) {
    const results = store.filter(opts);
    if (results.length === 0) {
      return { content: [{ type: "text", text: "No cached messages match the filter." }] };
    }
    const capped = results.slice(0, 100);
    const lines = capped.map((m, i) => {
      const date = new Date(m.date).toLocaleDateString();
      const unsub = m.hasUnsubscribe ? " [unsub]" : "";
      return `${i + 1}. **${m.subject}**\n   From: ${m.from} | ${date}${unsub}\n   ID: \`${m.id}\``;
    });
    const text = `${results.length} messages match${results.length > 100 ? " (showing first 100)" : ""}:\n\n${lines.join("\n\n")}`;
    return { content: [{ type: "text", text }] };
  },
};
