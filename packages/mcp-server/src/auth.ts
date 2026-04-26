import { PublicClientApplication, type AuthenticationResult, type DeviceCodeRequest, type SilentFlowRequest, type AccountInfo } from "@azure/msal-node";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const CACHE_DIR = join(homedir(), ".outlook-mcp");
const CACHE_FILE = join(CACHE_DIR, "token_cache.json");
const SCOPES = ["User.Read", "Mail.Read", "Mail.ReadWrite", "Mail.Send"];

let pca: PublicClientApplication | null = null;

function getClientId(): string {
  const id = process.env.OUTLOOK_MCP_CLIENT_ID;
  if (!id) throw new Error("OUTLOOK_MCP_CLIENT_ID environment variable is required");
  return id;
}

async function loadCache(): Promise<void> {
  if (!pca) return;
  try {
    const data = await readFile(CACHE_FILE, "utf-8");
    pca.getTokenCache().deserialize(data);
  } catch {
    // No cache file yet — that's fine
  }
}

async function saveCache(): Promise<void> {
  if (!pca) return;
  await mkdir(CACHE_DIR, { recursive: true });
  const data = pca.getTokenCache().serialize();
  await writeFile(CACHE_FILE, data, "utf-8");
}

function getPca(): PublicClientApplication {
  if (!pca) {
    pca = new PublicClientApplication({
      auth: {
        clientId: getClientId(),
        authority: "https://login.microsoftonline.com/consumers",
      },
    });
  }
  return pca;
}

async function getAccount(): Promise<AccountInfo | null> {
  const app = getPca();
  await loadCache();
  const accounts = await app.getTokenCache().getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

export async function acquireTokenSilent(): Promise<string | null> {
  const app = getPca();
  const account = await getAccount();
  if (!account) return null;

  try {
    const request: SilentFlowRequest = {
      account,
      scopes: SCOPES,
    };
    const result: AuthenticationResult = await app.acquireTokenSilent(request);
    await saveCache();
    return result.accessToken;
  } catch {
    return null;
  }
}

export interface DeviceCodeInfo {
  userCode: string;
  verificationUri: string;
  message: string;
}

export async function acquireTokenByDeviceCode(
  onDeviceCode: (info: DeviceCodeInfo) => void
): Promise<string> {
  const app = getPca();
  await loadCache();

  const request: DeviceCodeRequest = {
    scopes: SCOPES,
    deviceCodeCallback: (response) => {
      onDeviceCode({
        userCode: response.userCode,
        verificationUri: response.verificationUri,
        message: response.message,
      });
    },
  };

  const result = await app.acquireTokenByDeviceCode(request);
  if (!result) throw new Error("Device code authentication failed — no result returned");
  await saveCache();
  return result.accessToken;
}

export async function getAccessToken(
  onDeviceCode?: (info: DeviceCodeInfo) => void
): Promise<string> {
  const silent = await acquireTokenSilent();
  if (silent) return silent;

  if (!onDeviceCode) {
    throw new Error("No cached token available and no device code callback provided. Please login first.");
  }

  return acquireTokenByDeviceCode(onDeviceCode);
}

export async function isLoggedIn(): Promise<boolean> {
  const account = await getAccount();
  return account !== null;
}

export async function logout(): Promise<void> {
  const app = getPca();
  const accounts = await app.getTokenCache().getAllAccounts();
  for (const account of accounts) {
    await app.getTokenCache().removeAccount(account);
  }
  await saveCache();
}
