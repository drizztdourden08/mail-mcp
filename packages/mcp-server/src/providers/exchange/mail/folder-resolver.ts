import type { MailFolder } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";

const WELL_KNOWN_FOLDERS: Record<string, string> = {
  inbox: "inbox",
  drafts: "drafts",
  sentitems: "sentitems",
  sent: "sentitems",
  deleteditems: "deleteditems",
  deleted: "deleteditems",
  trash: "deleteditems",
  junkemail: "junkemail",
  junk: "junkemail",
  spam: "junkemail",
  archive: "archive",
  outbox: "outbox",
};

export class FolderResolver {
  private nameCache: Map<string, string> | null = null;

  constructor(private client: GraphClient) {}

  async resolve(nameOrId: string): Promise<string> {
    const wellKnown = WELL_KNOWN_FOLDERS[nameOrId.toLowerCase()];
    if (wellKnown) return wellKnown;

    if (nameOrId.length > 40) return nameOrId;

    if (!this.nameCache) {
      this.nameCache = await this.buildCache();
    }

    const folderId = this.nameCache.get(nameOrId.toLowerCase());
    if (folderId) return folderId;

    // Invalidate and retry once
    this.nameCache = await this.buildCache();
    const retryId = this.nameCache.get(nameOrId.toLowerCase());
    if (retryId) return retryId;

    throw new Error(`Folder not found: "${nameOrId}". Use folder:list or folder:tree to see available folders.`);
  }

  private async buildCache(): Promise<Map<string, string>> {
    const cache = new Map<string, string>();

    const addFolders = async (folders: MailFolder[]) => {
      for (const f of folders) {
        cache.set(f.displayName.toLowerCase(), f.id);
        if (f.childFolderCount && f.childFolderCount > 0) {
          const children = await this.fetchChildren(f.id);
          await addFolders(children);
        }
      }
    };

    const topLevel = await this.fetchTopLevel();
    await addFolders(topLevel);
    return cache;
  }

  private async fetchTopLevel(): Promise<MailFolder[]> {
    const params = new URLSearchParams({
      $select: "id,displayName,parentFolderId,totalItemCount,unreadItemCount,childFolderCount",
      $top: "100",
    });
    const res = await this.client.fetch(`/me/mailFolders?${params}`);
    const data = await res.json() as { value: MailFolder[] };
    return data.value;
  }

  async fetchChildren(parentId: string): Promise<MailFolder[]> {
    const params = new URLSearchParams({
      $select: "id,displayName,parentFolderId,totalItemCount,unreadItemCount,childFolderCount",
      $top: "100",
    });
    const res = await this.client.fetch(`/me/mailFolders/${encodeURIComponent(parentId)}/childFolders?${params}`);
    const data = await res.json() as { value: MailFolder[] };
    return data.value;
  }
}
