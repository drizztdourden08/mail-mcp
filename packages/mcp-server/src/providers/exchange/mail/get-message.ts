import type { MailMessage } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";
import { mapGraphMessage } from "./message-mapper.js";

export async function getMessage(client: GraphClient, id: string): Promise<MailMessage> {
  const params = new URLSearchParams({
    $select: "id,subject,body,bodyPreview,receivedDateTime,isRead,from,internetMessageHeaders",
  });
  const res = await client.fetch(`/me/messages/${encodeURIComponent(id)}?${params}`);
  const raw = await res.json();
  return mapGraphMessage(raw);
}
