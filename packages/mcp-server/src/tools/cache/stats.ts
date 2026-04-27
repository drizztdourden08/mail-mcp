import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const cacheStats: ToolDefinition = {
  name: "cache.stats",
  description: "Check if the email cache is warm. Returns message count, sync status, and last sync time. Always call this before cache.sync to avoid redundant fetches.",
  schema: {},
  async handler(_params, { store }) {
    const s = store.getSyncStatus();
    return { content: [{ type: "text", text: JSON.stringify(s) }] };
  },
};
