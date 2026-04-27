import { StoreProvider } from "../provider.js";
import type { MailMessage } from "../../types/mail.js";
import type { CachedMessage, SearchOptions, FilterOptions, SyncStatus } from "../../types/cache.js";
import { MessageStore } from "./message-store.js";
import { SyncTracker } from "./sync-tracker.js";
import { searchStore } from "./search.js";
import { filterStore } from "./filter.js";

export class MemoryStoreProvider extends StoreProvider {
  private store = new MessageStore();
  private tracker = new SyncTracker();

  add(messages: MailMessage[]): void {
    this.store.add(messages);
    this.tracker.setMessageCount(this.store.size);
  }

  get(id: string): CachedMessage | undefined {
    return this.store.get(id);
  }

  getAll(): CachedMessage[] {
    return this.store.getAll();
  }

  search(opts: SearchOptions): CachedMessage[] {
    return searchStore(this.store.getAll(), opts);
  }

  filter(opts: FilterOptions): CachedMessage[] {
    return filterStore(this.store.getAll(), opts);
  }

  clear(): number {
    return this.store.clear();
  }

  getSyncStatus(): SyncStatus {
    return this.tracker.getStatus();
  }

  setSyncing(folder: string): void {
    this.tracker.setSyncing(folder);
  }

  updateProgress(count: number): void {
    this.tracker.updateProgress(count);
  }

  completeSyncing(): void {
    this.tracker.completeSyncing();
    this.tracker.setMessageCount(this.store.size);
  }
}
