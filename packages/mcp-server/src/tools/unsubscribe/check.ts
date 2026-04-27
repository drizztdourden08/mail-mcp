import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const unsubscribeCheck: ToolDefinition = {
  name: "unsubscribe.check",
  description: "Check unsubscribe support for multiple emails at once (up to 20). Returns structured JSON for each message.",
  schema: {
    ids: z.array(z.string()).describe("Array of message IDs to check (max 20)"),
  },
  async handler({ ids }, { mail }) {
    const capped = ids.slice(0, 20);
    const results = await Promise.allSettled(
      capped.map((id: string) => mail.getUnsubscribeInfo(id))
    );
    const output = results.map((r, i) => {
      if (r.status === "rejected") return { id: capped[i], error: String(r.reason) };
      const info = r.value;
      return {
        id: info.messageId,
        subject: info.subject,
        from: info.from,
        hasUnsubscribe: !!info.listUnsubscribe,
        hasOneClick: info.hasOneClick,
        httpUrl: info.httpUrl,
        mailtoUrl: info.mailtoUrl,
      };
    });
    return { content: [{ type: "text", text: JSON.stringify(output) }] };
  },
};
