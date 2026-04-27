import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const cacheSearch: ToolDefinition = {
  name: "cache.search",
  description: "Search cached messages by text or regex. No API calls. Returns matching summaries (max 100). Use cache.sync first if cache is empty.",
  schema: {
    query: z.string().describe("Search text or regex pattern"),
    field: z.enum(["subject", "body", "from", "all"]).optional().describe("Which field to search (default: all)"),
    regex: z.boolean().optional().describe("Treat query as regex (default: false)"),
  },
  async handler({ query, field, regex }, { store }) {
    const results = store.search({ query, field: field ?? "all", regex: regex ?? false });
    if (results.length === 0) {
      return { content: [{ type: "text", text: `No cached messages match "${query}" in ${field ?? "all"}.` }] };
    }
    const capped = results.slice(0, 100);
    const lines = capped.map((m, i) => {
      const date = new Date(m.date).toLocaleDateString();
      const unsub = m.hasUnsubscribe ? " [unsub]" : "";
      return `${i + 1}. **${m.subject}**\n   From: ${m.from} | ${date}${unsub}\n   ID: \`${m.id}\``;
    });
    const text = `Found ${results.length} matches${results.length > 100 ? " (showing first 100)" : ""}:\n\n${lines.join("\n\n")}`;
    return { content: [{ type: "text", text }] };
  },
};
