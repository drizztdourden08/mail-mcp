export interface CachedMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  bodyPreview: string;
  bodyText: string;
  isRead: boolean;
  headers: Record<string, string>;
  hasUnsubscribe: boolean;
  unsubscribeHttpUrl: string | null;
  unsubscribeMailto: string | null;
  hasOneClick: boolean;
}

export interface SearchOptions {
  query: string;
  field: "subject" | "body" | "from" | "all";
  regex: boolean;
}

export interface FilterOptions {
  hasUnsubscribe?: boolean;
  isRead?: boolean;
  fromPattern?: string;
  afterDate?: string;
  beforeDate?: string;
}

export type SyncState = "idle" | "syncing" | "complete";

export interface SyncStatus {
  status: SyncState;
  folder: string | null;
  count: number;
  progress: number;
  lastSync: Date | null;
}
