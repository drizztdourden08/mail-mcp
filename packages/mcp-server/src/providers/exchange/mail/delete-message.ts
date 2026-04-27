import type { GraphClient } from "./graph-client.js";

export async function deleteMessage(client: GraphClient, id: string): Promise<void> {
  await client.fetch(`/me/messages/${encodeURIComponent(id)}`, { method: "DELETE" });
}
