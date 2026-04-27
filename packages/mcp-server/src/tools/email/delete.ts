import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const emailDelete: ToolDefinition = {
  name: "email.delete",
  description: "Delete one or more emails by ID. Accepts up to 50 IDs. Always present a review list first and only delete approved items.",
  schema: {
    ids: z.array(z.string()).describe("Array of message IDs to delete (max 50)"),
  },
  async handler({ ids }, { mail }) {
    const capped = ids.slice(0, 50);
    const results = await Promise.allSettled(capped.map((id: string) => mail.deleteMessage(id)));
    const ok = results.filter(r => r.status === "fulfilled").length;
    const failed = results
      .map((r, i) => r.status === "rejected" ? `${capped[i]}: ${(r as PromiseRejectedResult).reason}` : null)
      .filter(Boolean);
    const text = `Deleted ${ok}/${capped.length}.` +
      (failed.length > 0 ? `\nFailed:\n${failed.join("\n")}` : "");
    return { content: [{ type: "text", text }] };
  },
};
