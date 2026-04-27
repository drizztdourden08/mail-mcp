import type { DeviceCodeRequest } from "@azure/msal-node";
import type { MsalClient } from "./msal-client.js";
import type { AuthChallengeInfo } from "../../../types/auth.js";

export async function startDeviceCodeFlow(
  client: MsalClient,
  onChallenge: (info: AuthChallengeInfo) => void,
): Promise<string> {
  await client.loadCache();

  const request: DeviceCodeRequest = {
    scopes: client.scopes,
    deviceCodeCallback: (response) => {
      onChallenge({
        code: response.userCode,
        uri: response.verificationUri,
        message: response.message,
        expiresIn: response.expiresIn,
      });
    },
  };

  const result = await client.app.acquireTokenByDeviceCode(request);
  if (!result) throw new Error("Device code authentication failed — no result returned");
  await client.saveCache();
  return result.accessToken;
}
