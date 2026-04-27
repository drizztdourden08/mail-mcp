import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const reviewFinalize: ToolDefinition = {
  name: "review.finalize",
  description: "Mark a building review as ready for user approval (building → pending). The review becomes visible in the sidebar. Follow with review.await.",
  schema: {
    reviewId: z.string().describe("Review ID from review.create"),
    selectedByDefault: z.boolean().optional().describe("Set all items selected (true) or deselected (false). Omit to keep current state."),
  },
  async handler({ reviewId, selectedByDefault }, { reviews }) {
    const review = reviews.finalize(reviewId, selectedByDefault);
    return { content: [{ type: "text", text: JSON.stringify({ reviewId: review.id, itemCount: review.items.length }) }] };
  },
};
