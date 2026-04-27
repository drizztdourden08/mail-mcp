import type { SilentFlowRequest, AuthenticationResult } from "@azure/msal-node";
import type { MsalClient } from "./msal-client.js";
import type { AuthChallengeInfo } from "../../../types/auth.js";
import { startDeviceCodeFlow } from "./device-code-flow.js";

export async function getAccessToken(
  client: MsalClient,
  onChallenge?: (info: AuthChallengeInfo) => void,
): Promise<string> {
  // Try silent first
  const account = await client.getAccount();
  if (account) {
    try {
      const request: SilentFlowRequest = { account, scopes: client.scopes };
      const result: AuthenticationResult = await client.app.acquireTokenSilent(request);
      await client.saveCache();
      return result.accessToken;
    } catch {
      // Token expired — fall through
    }
  }

  if (!onChallenge) {
    throw new Error("No cached token available and no auth challenge callback provided. Please login first.");
  }

  return startDeviceCodeFlow(client, onChallenge);
}
