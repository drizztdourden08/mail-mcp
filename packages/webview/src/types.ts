// ── Shared types, constants, and interfaces ──

// Navigation
export type View = "home" | "settings" | "docs";

// Provider registry
export type AuthStrategy = "device-code" | "oauth-redirect" | "api-key";

export interface ProviderConfigField {
  key: string;
  label: string;
  description: string;
  envVar: string;
  required: boolean;
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

// Auth
export interface AuthChallenge {
  code: string;
  uri: string;
  source?: string;
  providerId?: string;
  expiresIn?: number;
}

// VS Code messaging
export type PostMessage = (msg: unknown) => void;
export type OnMessage = (handler: (msg: Record<string, unknown>) => void) => () => void;

export interface VSCodeBridge {
  postMessage: PostMessage;
  onMessage: OnMessage;
}
