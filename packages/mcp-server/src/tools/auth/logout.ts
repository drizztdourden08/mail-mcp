import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const authLogout: ToolDefinition = {
  name: "auth.logout",
  description: "Sign out from the current mail provider and clear cached tokens.",
  schema: {},
  async handler(_params, { auth }) {
    await auth.logout();
    return { content: [{ type: "text", text: "Signed out successfully." }] };
  },
};
