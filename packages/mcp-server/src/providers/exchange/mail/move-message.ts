import type { MailMessage } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";
import type { FolderResolver } from "./folder-resolver.js";
import { mapGraphMessage } from "./message-mapper.js";

export async function moveMessage(
  client: GraphClient,
  resolver: FolderResolver,
  id: string,
  destinationFolder: string,
): Promise<MailMessage> {
  const resolvedFolder = await resolver.resolve(destinationFolder);
  const res = await client.fetch(`/me/messages/${encodeURIComponent(id)}/move`, {
    method: "POST",
    body: JSON.stringify({ destinationId: resolvedFolder }),
  });
  const raw = await res.json();
  return mapGraphMessage(raw);
}
