import { z } from "zod";
import type { ToolDefinition } from "../../types/tool.js";

export const cacheSync: ToolDefinition = {
  name: "cache.sync",
  description: "Fetch ALL messages from a folder into the local cache (body + headers). Fetches in batches of 50 with pagination. Use cache.stats first to check if cache is already warm.",
  schema: {
    folder: z.string().optional().describe("Folder to sync (default: Inbox)"),
  },
  async handler({ folder }, { mail, store }) {
    const status = store.getSyncStatus();
    if (status.status === "syncing") {
      return { content: [{ type: "text", text: `Sync already in progress (${status.progress} fetched so far).` }] };
    }

    const targetFolder = folder ?? "Inbox";
    store.setSyncing(targetFolder);
    try {
      const msgs = await mail.fetchAllMessages(targetFolder, 50, (count) => {
        store.updateProgress(count);
        process.stderr.write(`[cache] synced ${count} messages...\n`);
      });
      store.add(msgs);
      store.completeSyncing();
      return { content: [{ type: "text", text: `Synced ${msgs.length} messages from ${targetFolder} into cache. Unsubscribe headers pre-parsed. Use cache.search/cache.filter to query.` }] };
    } catch (err) {
      store.completeSyncing();
      return { content: [{ type: "text", text: `Sync failed after ${store.getSyncStatus().count} messages: ${err}` }] };
    }
  },
};
