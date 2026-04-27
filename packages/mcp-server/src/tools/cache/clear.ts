import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const cacheClear: ToolDefinition = {
  name: "cache.clear",
  description: "Wipe the local email cache to free memory. Suggest this to the user when the task is complete.",
  schema: {},
  async handler(_params, { store }) {
    const count = store.clear();
    return { content: [{ type: "text", text: `Cache cleared. Removed ${count} messages.` }] };
  },
};
