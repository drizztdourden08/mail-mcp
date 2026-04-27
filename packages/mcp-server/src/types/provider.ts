export type AuthStrategy = "device-code" | "oauth-redirect" | "api-key";

export interface ProviderConfigField {
  /** Machine key used in VS Code settings and .env (e.g. "clientId") */
  key: string;
  /** Human-readable label shown in the UI (e.g. "Application (Client) ID") */
  label: string;
  /** Help text shown below the field */
  description: string;
  /** Corresponding environment variable name (e.g. "MAIL_MCP_CLIENT_ID") */
  envVar: string;
  /** Whether this field is required for the provider to function */
  required: boolean;
  /** If true, the field is masked in the UI */
  secret?: boolean;
}

export interface ProviderInfo {
  id: string;
  name: string;
  svgLogo: string;
  authStrategy: AuthStrategy;
  isConfigured: boolean;
  setupMarkdown: string;
  configFields: ProviderConfigField[];
}
