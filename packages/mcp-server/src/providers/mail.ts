import type { MailMessage, MailFolder, FolderTreeNode, UnsubscribeInfo } from "../types/mail.js";

export abstract class MailProvider {
  abstract listMessages(folder: string, count: number): Promise<MailMessage[]>;
  abstract getMessage(id: string): Promise<MailMessage>;
  abstract deleteMessage(id: string): Promise<void>;
  abstract moveMessage(id: string, folder: string): Promise<MailMessage>;
  abstract searchMessages(query: string, count: number): Promise<MailMessage[]>;
  abstract listFolders(): Promise<MailFolder[]>;
  abstract listFolderHierarchy(): Promise<FolderTreeNode[]>;
  abstract fetchAllMessages(
    folder: string,
    batchSize: number,
    onProgress?: (count: number) => void,
  ): Promise<MailMessage[]>;
  abstract getUnsubscribeInfo(id: string): Promise<UnsubscribeInfo>;
  abstract executeUnsubscribe(info: UnsubscribeInfo): Promise<string>;
}
