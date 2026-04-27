import type { MailMessage } from "../../types/mail.js";
import type { CachedMessage } from "../../types/cache.js";
import { mailToCached } from "./message-converter.js";

export class MessageStore {
  private messages = new Map<string, CachedMessage>();

  add(msgs: MailMessage[]): void {
    for (const msg of msgs) {
      this.messages.set(msg.id, mailToCached(msg));
    }
  }

  get(id: string): CachedMessage | undefined {
    return this.messages.get(id);
  }

  getAll(): CachedMessage[] {
    return [...this.messages.values()];
  }

  get size(): number {
    return this.messages.size;
  }

  clear(): number {
    const count = this.messages.size;
    this.messages.clear();
    return count;
  }
}
