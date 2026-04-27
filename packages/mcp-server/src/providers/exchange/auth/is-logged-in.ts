import type { MsalClient } from "./msal-client.js";

export async function isLoggedIn(client: MsalClient): Promise<boolean> {
  const account = await client.getAccount();
  return account !== null;
}
