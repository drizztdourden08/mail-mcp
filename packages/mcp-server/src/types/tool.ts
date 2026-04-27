import type { z } from "zod";
import type { AuthProvider } from "../providers/auth.js";
import type { MailProvider } from "../providers/mail.js";
import type { StoreProvider } from "../store/provider.js";
import type { ReviewManager } from "../services/review-manager.js";

export interface AuthToolState {
  pendingAuth: { code: string; uri: string; expiresIn?: number } | null;
  authResolve: (() => void) | null;
}

export interface ToolContext {
  auth: AuthProvider;
  mail: MailProvider;
  store: StoreProvider;
  reviews: ReviewManager;
  authState: AuthToolState;
}

export interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  schema: Record<string, z.ZodTypeAny>;
  handler(params: any, ctx: ToolContext): Promise<ToolResult>;
}
