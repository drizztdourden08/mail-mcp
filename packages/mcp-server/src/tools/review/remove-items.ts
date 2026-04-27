import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const reviewRemoveItems: ToolDefinition = {
  name: "review.remove_items",
  description: "Remove items from a review by ID. The review must be in 'building' state. Use review.update to transition back to building if needed.",
  schema: {
    reviewId: z.string().describe("Review ID"),
    ids: z.array(z.string()).describe("Item IDs to remove"),
  },
  async handler({ reviewId, ids }, { reviews }) {
    const result = reviews.removeItems(reviewId, ids);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
};
