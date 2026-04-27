import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const emailRead: ToolDefinition = {
  name: "email.read",
  description: "Read the full content of an email by ID, including body text and metadata.",
  schema: {
    id: z.string().describe("Message ID"),
  },
  async handler({ id }, { mail }) {
    const msg = await mail.getMessage(id);
    const body = msg.body?.text ?? msg.preview;

    const text = [
      `**Subject:** ${msg.subject}`,
      `**From:** ${msg.from.email}`,
      `**Date:** ${msg.date}`,
      `**Read:** ${msg.isRead}`,
      "",
      body,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  },
};
