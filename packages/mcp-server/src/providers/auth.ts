import type { AuthChallengeInfo } from "../types/auth.js";

export abstract class AuthProvider {
  abstract isLoggedIn(): Promise<boolean>;
  abstract getAccessToken(onChallenge?: (info: AuthChallengeInfo) => void): Promise<string>;
  abstract logout(): Promise<void>;
}
