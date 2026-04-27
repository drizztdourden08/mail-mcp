import type { MsalClient } from "./msal-client.js";

export async function logout(client: MsalClient): Promise<void> {
  const accounts = await client.app.getTokenCache().getAllAccounts();
  for (const account of accounts) {
    await client.app.getTokenCache().removeAccount(account);
  }
  await client.saveCache();
}
