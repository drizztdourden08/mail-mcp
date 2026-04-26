import * as vscode from "vscode";
import { PublicClientApplication, type DeviceCodeRequest, type AuthenticationResult } from "@azure/msal-node";

const CLIENT_ID = "ab2d883c-b77b-4bcc-ac96-6bc75f66b3b4";
const AUTHORITY = "https://login.microsoftonline.com/consumers";
const SCOPES = ["User.Read", "Mail.Read", "Mail.ReadWrite", "Mail.Send"];

export class AuthManager {
  private pca: PublicClientApplication;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.pca = new PublicClientApplication({
      auth: { clientId: CLIENT_ID, authority: AUTHORITY },
    });
    this.loadCache();
  }

  private async loadCache() {
    const cached = await this.context.secrets.get("outlook-mcp.tokenCache");
    if (cached) {
      this.pca.getTokenCache().deserialize(cached);
    }
  }

  private async saveCache() {
    const data = this.pca.getTokenCache().serialize();
    await this.context.secrets.store("outlook-mcp.tokenCache", data);
  }

  async isLoggedIn(): Promise<boolean> {
    await this.loadCache();
    const accounts = await this.pca.getTokenCache().getAllAccounts();
    return accounts.length > 0;
  }

  async acquireTokenSilent(): Promise<string | null> {
    await this.loadCache();
    const accounts = await this.pca.getTokenCache().getAllAccounts();
    if (accounts.length === 0) return null;

    try {
      const result: AuthenticationResult = await this.pca.acquireTokenSilent({
        account: accounts[0],
        scopes: SCOPES,
      });
      await this.saveCache();
      return result.accessToken;
    } catch {
      return null;
    }
  }

  async acquireTokenByDeviceCode(): Promise<{ userCode: string; verificationUri: string; tokenPromise: Promise<string> }> {
    await this.loadCache();

    let resolveCode!: (value: { userCode: string; verificationUri: string }) => void;
    const codePromise = new Promise<{ userCode: string; verificationUri: string }>((r) => { resolveCode = r; });

    const request: DeviceCodeRequest = {
      scopes: SCOPES,
      deviceCodeCallback: (response) => {
        resolveCode({
          userCode: response.userCode,
          verificationUri: response.verificationUri,
        });
      },
    };

    const resultPromise = this.pca.acquireTokenByDeviceCode(request);
    const codeInfo = await codePromise;

    const tokenPromise = resultPromise.then(async (result) => {
      if (!result) throw new Error("Authentication failed");
      await this.saveCache();
      return result.accessToken;
    });

    return { ...codeInfo, tokenPromise };
  }

  async logout() {
    await this.loadCache();
    const accounts = await this.pca.getTokenCache().getAllAccounts();
    for (const account of accounts) {
      await this.pca.getTokenCache().removeAccount(account);
    }
    await this.saveCache();
  }
}
