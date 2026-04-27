import type { AuthProvider } from "../../auth.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const MAX_RETRIES = 4;

export class GraphClient {
  constructor(private auth: AuthProvider) {}

  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.auth.getAccessToken();
    const url = path.startsWith("http") ? path : `${GRAPH_BASE}${path}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (response.status === 429 || response.status === 503) {
        if (attempt === MAX_RETRIES) {
          const body = await response.text();
          throw new Error(`Graph API error ${response.status} after ${MAX_RETRIES} retries: ${body}`);
        }
        const retryAfter = parseInt(response.headers.get("Retry-After") ?? "", 10);
        const delayMs = (retryAfter > 0 ? retryAfter : Math.pow(2, attempt + 1)) * 1000;
        process.stderr.write(`[graph] ${response.status} throttled, retry ${attempt + 1}/${MAX_RETRIES} in ${delayMs}ms\n`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Graph API error ${response.status}: ${body}`);
      }
      return response;
    }
    throw new Error("Unreachable");
  }
}
