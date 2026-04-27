import type { MailFolder, FolderTreeNode } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";
import type { FolderResolver } from "./folder-resolver.js";
import { listFolders } from "./list-folders.js";

async function buildTree(resolver: FolderResolver, folders: MailFolder[]): Promise<FolderTreeNode[]> {
  const nodes: FolderTreeNode[] = [];
  for (const f of folders) {
    const node: FolderTreeNode = {
      id: f.id,
      displayName: f.displayName,
      totalItemCount: f.totalItemCount,
      unreadItemCount: f.unreadItemCount,
      children: [],
    };
    if (f.childFolderCount && f.childFolderCount > 0) {
      const children = await resolver.fetchChildren(f.id);
      node.children = await buildTree(resolver, children);
    }
    nodes.push(node);
  }
  return nodes;
}

export async function listFolderHierarchy(
  client: GraphClient,
  resolver: FolderResolver,
): Promise<FolderTreeNode[]> {
  const topLevel = await listFolders(client);
  return buildTree(resolver, topLevel);
}
