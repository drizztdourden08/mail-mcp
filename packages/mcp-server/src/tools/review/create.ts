import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

const DEFAULT_COLUMNS = [
  { key: "subject", label: "Subject" },
  { key: "from", label: "From" },
  { key: "date", label: "Date", width: "100px" },
];

export const reviewCreate: ToolDefinition = {
  name: "review.create",
  description: "Create an empty review list (status=building). Returns reviewId. Follow with review.add_items to populate, then review.update(status: 'pending') to present to user, then review.await.",
  schema: {
    name: z.string().describe("Tab name shown to the user"),
    description: z.string().describe("Markdown description shown above the list"),
    columns: z.array(z.object({
      key: z.string(),
      label: z.string(),
      width: z.string().optional(),
    })).optional().describe("Column definitions (defaults to Subject/From/Date)"),
  },
  async handler({ name, description, columns }, { reviews }) {
    const review = reviews.create({
      name,
      description,
      columns: columns ?? DEFAULT_COLUMNS,
    });
    return { content: [{ type: "text", text: JSON.stringify({ reviewId: review.id }) }] };
  },
};
