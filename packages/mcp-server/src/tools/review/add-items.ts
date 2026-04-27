import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";
import type { ReviewItem } from "../../types/review.js";

export const reviewAddItems: ToolDefinition = {
  name: "review.add_items",
  description: "Append items to a building review. Send items[] (max 50, custom fields) OR ids[] (max 200, resolved from cache). Can be called multiple times.",
  schema: {
    reviewId: z.string().describe("Review ID from review.create"),
    items: z.array(z.object({
      id: z.string(),
      selected: z.boolean().optional(),
      fields: z.record(z.string()),
    })).optional().describe("Items with custom fields (max 50)"),
    ids: z.array(z.string()).optional().describe("Message IDs to resolve from cache (max 200)"),
  },
  async handler({ reviewId, items, ids }, { reviews, store }) {
    const toAppend: ReviewItem[] = [];

    if (items) {
      const capped = items.slice(0, 50);
      toAppend.push(...capped.map((i: any) => ({
        id: i.id,
        selected: i.selected !== false,
        fields: i.fields,
      })));
    }

    if (ids) {
      const capped = ids.slice(0, 200);
      const missing: string[] = [];
      for (const id of capped) {
        const msg = store.get(id);
        if (msg) {
          toAppend.push({
            id: msg.id,
            selected: true,
            fields: { subject: msg.subject, from: msg.from, date: msg.date.slice(0, 10) },
          });
        } else {
          missing.push(id);
        }
      }
      if (missing.length > 0) {
        // Append what we have, report missing
        const result = reviews.appendItems(reviewId, toAppend);
        return { content: [{ type: "text", text: JSON.stringify({ ...result, missingFromCache: missing.length }) }] };
      }
    }

    const result = reviews.appendItems(reviewId, toAppend);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
};
