import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const unsubscribeExecute: ToolDefinition = {
  name: "unsubscribe.execute",
  description: "Execute unsubscribe for one or more emails (up to 20). Always present a review list first and only unsubscribe from approved items.",
  schema: {
    ids: z.array(z.string()).describe("Array of message IDs to unsubscribe from (max 20)"),
  },
  async handler({ ids }, { mail }) {
    const capped = ids.slice(0, 20);
    const results = await Promise.allSettled(
      capped.map(async (id: string) => {
        const info = await mail.getUnsubscribeInfo(id);
        if (!info.listUnsubscribe) return `${info.from}: no unsubscribe headers`;
        return mail.executeUnsubscribe(info);
      })
    );
    const lines = results.map((r, i) => {
      if (r.status === "rejected") return `❌ ${capped[i]}: ${r.reason}`;
      return `✅ ${r.value}`;
    });
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
};
