import { AuthProvider } from "../../auth.js";
import type { AuthChallengeInfo } from "../../../types/auth.js";
import { MsalClient } from "./msal-client.js";
import { isLoggedIn } from "./is-logged-in.js";
import { getAccessToken } from "./get-access-token.js";
import { logout } from "./logout.js";

export class MsalAuthProvider extends AuthProvider {
  private client: MsalClient;

  constructor(clientId: string, cachePath: string) {
    super();
    this.client = new MsalClient(clientId, cachePath);
  }

  async isLoggedIn(): Promise<boolean> {
    return isLoggedIn(this.client);
  }

  async getAccessToken(onChallenge?: (info: AuthChallengeInfo) => void): Promise<string> {
    return getAccessToken(this.client, onChallenge);
  }

  async logout(): Promise<void> {
    return logout(this.client);
  }
}
