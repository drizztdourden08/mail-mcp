import { MailProvider } from "../../mail.js";
import type { AuthProvider } from "../../auth.js";
import type { MailMessage, MailFolder, FolderTreeNode, UnsubscribeInfo } from "../../../types/mail.js";
import { GraphClient } from "./graph-client.js";
import { FolderResolver } from "./folder-resolver.js";
import { listMessages } from "./list-messages.js";
import { getMessage } from "./get-message.js";
import { deleteMessage } from "./delete-message.js";
import { moveMessage } from "./move-message.js";
import { searchMessages } from "./search-messages.js";
import { listFolders } from "./list-folders.js";
import { listFolderHierarchy } from "./folder-hierarchy.js";
import { fetchAllMessages } from "./fetch-all-messages.js";
import { getUnsubscribeInfo } from "./get-unsubscribe-info.js";
import { executeUnsubscribe } from "./execute-unsubscribe.js";

export class ExchangeMailProvider extends MailProvider {
  private client: GraphClient;
  private resolver: FolderResolver;

  constructor(auth: AuthProvider) {
    super();
    this.client = new GraphClient(auth);
    this.resolver = new FolderResolver(this.client);
  }

  async listMessages(folder: string, count: number): Promise<MailMessage[]> {
    return listMessages(this.client, this.resolver, folder, count);
  }

  async getMessage(id: string): Promise<MailMessage> {
    return getMessage(this.client, id);
  }

  async deleteMessage(id: string): Promise<void> {
    return deleteMessage(this.client, id);
  }

  async moveMessage(id: string, folder: string): Promise<MailMessage> {
    return moveMessage(this.client, this.resolver, id, folder);
  }

  async searchMessages(query: string, count: number): Promise<MailMessage[]> {
    return searchMessages(this.client, query, count);
  }

  async listFolders(): Promise<MailFolder[]> {
    return listFolders(this.client);
  }

  async listFolderHierarchy(): Promise<FolderTreeNode[]> {
    return listFolderHierarchy(this.client, this.resolver);
  }

  async fetchAllMessages(
    folder: string,
    batchSize: number,
    onProgress?: (count: number) => void,
  ): Promise<MailMessage[]> {
    return fetchAllMessages(this.client, this.resolver, folder, batchSize, onProgress);
  }

  async getUnsubscribeInfo(id: string): Promise<UnsubscribeInfo> {
    return getUnsubscribeInfo(this.client, id);
  }

  async executeUnsubscribe(info: UnsubscribeInfo): Promise<string> {
    return executeUnsubscribe(this.client, info);
  }
}
