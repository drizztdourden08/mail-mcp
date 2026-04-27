import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const reviewUpdate: ToolDefinition = {
  name: "review.update",
  description: [
    "Update a review's status. Supports state transitions:",
    "  building → pending (same as finalize)",
    "  pending → building (reopen for edits)",
    "  Any state → closed (remove the review)",
  ].join("\n"),
  schema: {
    reviewId: z.string().describe("Review ID"),
    status: z.enum(["building", "pending", "closed"]).describe("Transition the review to this status"),
    selectedByDefault: z.boolean().optional().describe("When transitioning to pending, set all items selected/deselected"),
  },
  async handler({ reviewId, status, selectedByDefault }, { reviews }) {
    const review = reviews.get(reviewId);
    if (!review) {
      return { content: [{ type: "text", text: "Review not found." }], isError: true };
    }

    reviews.setStatus(reviewId, status, selectedByDefault);

    const updated = reviews.get(reviewId);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          reviewId,
          status: updated?.status,
          itemCount: updated?.items.length ?? 0,
        }),
      }],
    };
  },
};
