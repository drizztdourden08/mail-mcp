export type AuthStrategy = "device-code" | "oauth-redirect" | "api-key";

export interface ProviderInfo {
  id: string;
  name: string;
  svgLogo: string;
  authStrategy: AuthStrategy;
  isConfigured: boolean;
  setupMarkdown: string;
}
