import type { PublicClientApplication } from "@azure/msal-node";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";

export async function loadCache(pca: PublicClientApplication, cachePath: string): Promise<void> {
  const file = join(cachePath, "token_cache.json");
  try {
    const data = await readFile(file, "utf-8");
    pca.getTokenCache().deserialize(data);
  } catch {
    // No cache file yet
  }
}

export async function saveCache(pca: PublicClientApplication, cachePath: string): Promise<void> {
  const file = join(cachePath, "token_cache.json");
  await mkdir(dirname(file), { recursive: true });
  const data = pca.getTokenCache().serialize();
  await writeFile(file, data, "utf-8");
}
