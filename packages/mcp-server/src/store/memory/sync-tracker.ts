import type { SyncStatus, SyncState } from "../../types/cache.js";

export class SyncTracker {
  private status: SyncState = "idle";
  private folder: string | null = null;
  private progress = 0;
  private lastSync: Date | null = null;
  private messageCount = 0;

  getStatus(): SyncStatus {
    return {
      status: this.status,
      folder: this.folder,
      count: this.messageCount,
      progress: this.progress,
      lastSync: this.lastSync,
    };
  }

  setSyncing(folder: string): void {
    this.status = "syncing";
    this.folder = folder;
    this.progress = 0;
  }

  updateProgress(count: number): void {
    this.progress = count;
  }

  completeSyncing(): void {
    this.status = "complete";
    this.lastSync = new Date();
  }

  setMessageCount(count: number): void {
    this.messageCount = count;
  }
}
