import type { MailMessage } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";
import type { FolderResolver } from "./folder-resolver.js";
import { mapGraphMessage } from "./message-mapper.js";

export async function listMessages(
  client: GraphClient,
  resolver: FolderResolver,
  folder: string,
  count: number,
): Promise<MailMessage[]> {
  const folderId = await resolver.resolve(folder);
  const params = new URLSearchParams({
    $top: String(count),
    $select: "id,subject,bodyPreview,receivedDateTime,isRead,from",
    $orderby: "receivedDateTime desc",
  });
  const res = await client.fetch(`/me/mailFolders/${folderId}/messages?${params}`);
  const data = await res.json() as { value: any[] };
  return data.value.map(mapGraphMessage);
}
