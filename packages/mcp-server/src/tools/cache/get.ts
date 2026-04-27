import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const cacheGet: ToolDefinition = {
  name: "cache.get",
  description: "Get the full body and headers of a cached message by ID. No API call. Use after cache.sync.",
  schema: {
    id: z.string().describe("Message ID"),
  },
  async handler({ id }, { store }) {
    const msg = store.get(id);
    if (!msg) {
      return { content: [{ type: "text", text: "Message not in cache. Run cache.sync first." }] };
    }
    const text = [
      `**Subject:** ${msg.subject}`,
      `**From:** ${msg.from}`,
      `**Date:** ${msg.date}`,
      `**Read:** ${msg.isRead}`,
      `**Unsubscribe:** ${msg.hasUnsubscribe ? "Yes" : "No"}${msg.hasOneClick ? " (one-click)" : ""}`,
      "",
      msg.bodyText.slice(0, 5000),
      msg.bodyText.length > 5000 ? "\n... (truncated)" : "",
    ].join("\n");
    return { content: [{ type: "text", text }] };
  },
};
