import type { MailMessage } from "../types/mail.js";
import type { CachedMessage, SearchOptions, FilterOptions, SyncStatus } from "../types/cache.js";

export abstract class StoreProvider {
  abstract add(messages: MailMessage[]): void;
  abstract get(id: string): CachedMessage | undefined;
  abstract getAll(): CachedMessage[];
  abstract search(opts: SearchOptions): CachedMessage[];
  abstract filter(opts: FilterOptions): CachedMessage[];
  abstract clear(): number;
  abstract getSyncStatus(): SyncStatus;
  abstract setSyncing(folder: string): void;
  abstract updateProgress(count: number): void;
  abstract completeSyncing(): void;
}
