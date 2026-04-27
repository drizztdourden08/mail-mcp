import { PublicClientApplication, type AccountInfo, type AuthenticationResult } from "@azure/msal-node";
import { loadCache, saveCache } from "./token-cache.js";

const SCOPES = ["User.Read", "Mail.Read", "Mail.ReadWrite", "Mail.Send"];

export class MsalClient {
  private pca: PublicClientApplication;

  constructor(
    readonly clientId: string,
    readonly cachePath: string,
  ) {
    this.pca = new PublicClientApplication({
      auth: {
        clientId,
        authority: "https://login.microsoftonline.com/consumers",
      },
    });
  }

  get app(): PublicClientApplication {
    return this.pca;
  }

  get scopes(): string[] {
    return SCOPES;
  }

  async loadCache(): Promise<void> {
    await loadCache(this.pca, this.cachePath);
  }

  async saveCache(): Promise<void> {
    await saveCache(this.pca, this.cachePath);
  }

  async getAccount(): Promise<AccountInfo | null> {
    await this.loadCache();
    const accounts = await this.pca.getTokenCache().getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }
}
