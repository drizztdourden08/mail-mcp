import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const reviewAwait: ToolDefinition = {
  name: "review.await",
  description: "Block until the user approves or rejects a review. Returns { approved: boolean, selectedIds: string[] }. Call after review.finalize.",
  schema: {
    reviewId: z.string().describe("Review ID"),
    timeoutSeconds: z.number().optional().describe("Max seconds to wait (default 600)"),
  },
  async handler({ reviewId, timeoutSeconds }, { reviews }) {
    const result = await reviews.waitForApproval(reviewId, (timeoutSeconds ?? 600) * 1000);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
};
