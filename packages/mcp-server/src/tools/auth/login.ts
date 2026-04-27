import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const authLogin: ToolDefinition = {
  name: "auth.login",
  description: [
    "Sign in to a mail provider. The extension will handle the interactive auth challenge (e.g. copy code and open browser).",
    "",
    "## Setup Knowledge (share with user if they have trouble connecting)",
    "For Microsoft Exchange / Outlook:",
    "1. An Azure AD App Registration is required with permissions: User.Read, Mail.Read, Mail.ReadWrite, Mail.Send.",
    "2. Device Code Flow must be enabled: App Registration → Authentication → Allow public client flows → Yes.",
    "3. The MAIL_MCP_CLIENT_ID environment variable must be set to the Application (client) ID.",
    "4. Common errors:",
    "   - AADSTS50059: Tenant doesn't allow personal accounts — recreate app with correct account type.",
    "   - Insufficient privileges: Admin consent not granted — IT admin must grant consent.",
    "   - Token cache issues: Delete ~/.mail-mcp/token_cache.json and retry.",
    "5. Direct the user to the Setup tab in the Mail MCP panel for full step-by-step instructions.",
  ].join("\n"),
  schema: {
    provider: z.string().optional().describe("Provider to authenticate with (e.g. 'exchange', 'gmail'). Defaults to the configured provider."),
  },
  async handler(_params, { auth, authState }) {
    const loggedIn = await auth.isLoggedIn();
    if (loggedIn) {
      try {
        await auth.getAccessToken();
        return { content: [{ type: "text", text: "Already signed in. Token is valid." }] };
      } catch {
        // Token expired, fall through to interactive auth
      }
    }

    authState.pendingAuth = null;
    let tokenPromise: Promise<string>;
    try {
      tokenPromise = auth.getAccessToken((info) => {
        authState.pendingAuth = { code: info.code, uri: info.uri, expiresIn: info.expiresIn };
        if (authState.authResolve) {
          authState.authResolve();
          authState.authResolve = null;
        }
      });
    } catch (err) {
      return { content: [{ type: "text", text: `Sign in failed: ${err}` }] };
    }

    // Wait up to 10s for auth challenge to be generated
    if (!authState.pendingAuth) {
      await Promise.race([
        new Promise<void>((r) => { authState.authResolve = r; }),
        new Promise<void>((_, r) => setTimeout(() => r(new Error("timeout")), 10000)),
      ]).catch(() => {});
    }

    if (!authState.pendingAuth) {
      return { content: [{ type: "text", text: "Sign in failed: timed out waiting for auth challenge." }] };
    }

    const { code: savedCode, uri: savedUri } = authState.pendingAuth;

    try {
      await tokenPromise!;
      authState.pendingAuth = null;
      return { content: [{ type: "text", text: "Signed in successfully! The panel is now ready." }] };
    } catch (err) {
      authState.pendingAuth = null;
      return {
        content: [{
          type: "text",
          text: `Sign in failed: ${err}\n\nYou can try again or go to ${savedUri} and enter **${savedCode}** manually.`,
        }],
      };
    }
  },
};
