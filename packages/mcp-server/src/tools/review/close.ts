import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const reviewClose: ToolDefinition = {
  name: "review.close",
  description: "Close and remove a review tab. Use this after processing approved items or to clean up stale reviews.",
  schema: {
    reviewId: z.string().describe("Review ID"),
  },
  async handler({ reviewId }, { reviews }) {
    reviews.close(reviewId);
    return { content: [{ type: "text", text: "Review closed." }] };
  },
};
