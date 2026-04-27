export interface EmailAddress {
  email: string;
  name: string;
}

export interface MailMessage {
  id: string;
  subject: string;
  preview: string;
  from: EmailAddress;
  date: string;
  isRead: boolean;
  body?: {
    text: string;
    html?: string;
  };
  headers?: Record<string, string>;
}

export interface MailFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  totalItemCount: number;
  unreadItemCount: number;
  childFolderCount?: number;
}

export interface FolderTreeNode {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
  children: FolderTreeNode[];
}

export interface UnsubscribeInfo {
  messageId: string;
  subject: string;
  from: string;
  listUnsubscribe: string | null;
  listUnsubscribePost: string | null;
  hasOneClick: boolean;
  httpUrl: string | null;
  mailtoUrl: string | null;
}
