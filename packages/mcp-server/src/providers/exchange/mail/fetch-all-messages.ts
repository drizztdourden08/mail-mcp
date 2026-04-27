import type { MailMessage } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";
import type { FolderResolver } from "./folder-resolver.js";
import { mapGraphMessage } from "./message-mapper.js";

export async function fetchAllMessages(
  client: GraphClient,
  resolver: FolderResolver,
  folder: string,
  batchSize: number,
  onProgress?: (fetched: number) => void,
): Promise<MailMessage[]> {
  const folderId = await resolver.resolve(folder);
  const all: MailMessage[] = [];
  const params = new URLSearchParams({
    $top: String(batchSize),
    $select: "id,subject,body,bodyPreview,receivedDateTime,isRead,from,internetMessageHeaders",
    $orderby: "receivedDateTime desc",
  });

  let url: string | null = `/me/mailFolders/${folderId}/messages?${params}`;

  while (url) {
    const res = await client.fetch(url);
    const data = await res.json() as { value: any[]; "@odata.nextLink"?: string };
    all.push(...data.value.map(mapGraphMessage));
    onProgress?.(all.length);
    url = data["@odata.nextLink"] ?? null;
    if (url) await new Promise(r => setTimeout(r, 300));
  }

  return all;
}
