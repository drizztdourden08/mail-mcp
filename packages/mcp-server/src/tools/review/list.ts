import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const reviewList: ToolDefinition = {
  name: "review.list",
  description: "Get all reviews with their status, item count, and IDs. Use this to discover existing reviews for cleanup or to get review IDs.",
  schema: {},
  async handler(_params, { reviews }) {
    const all = reviews.getAll();
    const summary = all.map(r => ({
      reviewId: r.id,
      name: r.name,
      status: r.status,
      itemCount: r.items.length,
      createdAt: r.createdAt,
    }));
    return { content: [{ type: "text", text: JSON.stringify(summary) }] };
  },
};
