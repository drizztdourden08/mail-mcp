import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const emailMove: ToolDefinition = {
  name: "email.move",
  description: "Move one or more emails to a folder. Accepts up to 50 IDs. Returns old→new ID mappings.",
  schema: {
    ids: z.array(z.string()).describe("Array of message IDs to move (max 50)"),
    folder: z.string().describe("Destination folder name or ID (e.g. 'Archive', 'DeletedItems', 'Junk')"),
  },
  async handler({ ids, folder }, { mail }) {
    const capped = ids.slice(0, 50);
    const results = await Promise.allSettled(
      capped.map((id: string) => mail.moveMessage(id, folder))
    );
    const succeeded: string[] = [];
    const errors: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        succeeded.push(`${capped[i]} → ${r.value.id}`);
      } else {
        errors.push(`${capped[i]}: ${r.reason}`);
      }
    });
    const text = `Moved ${succeeded.length}/${capped.length} messages.` +
      (succeeded.length > 0 ? `\nNew IDs:\n${succeeded.join("\n")}` : "") +
      (errors.length > 0 ? `\nFailed (${errors.length}):\n${errors.join("\n")}` : "");
    return { content: [{ type: "text", text }] };
  },
};
