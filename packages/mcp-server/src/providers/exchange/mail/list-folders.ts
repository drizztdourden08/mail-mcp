import type { MailFolder } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";

export async function listFolders(client: GraphClient): Promise<MailFolder[]> {
  const params = new URLSearchParams({
    $select: "id,displayName,parentFolderId,totalItemCount,unreadItemCount,childFolderCount",
    $top: "100",
  });
  const res = await client.fetch(`/me/mailFolders?${params}`);
  const data = await res.json() as { value: MailFolder[] };
  return data.value;
}
