import type { MailMessage } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";
import { mapGraphMessage } from "./message-mapper.js";

export async function searchMessages(
  client: GraphClient,
  query: string,
  count: number,
): Promise<MailMessage[]> {
  const params = new URLSearchParams({
    $search: `"${query}"`,
    $top: String(count),
    $select: "id,subject,bodyPreview,receivedDateTime,isRead,from",
  });
  const res = await client.fetch(`/me/messages?${params}`);
  const data = await res.json() as { value: any[] };
  return data.value.map(mapGraphMessage);
}
