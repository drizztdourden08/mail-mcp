import type { UnsubscribeInfo } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";
import { getMessage } from "./get-message.js";

export async function getUnsubscribeInfo(client: GraphClient, id: string): Promise<UnsubscribeInfo> {
  const msg = await getMessage(client, id);
  const headers = msg.headers ?? {};

  const unsubHeader = headers["list-unsubscribe"] ?? null;
  const unsubPostHeader = headers["list-unsubscribe-post"] ?? null;

  let httpUrl: string | null = null;
  let mailtoUrl: string | null = null;

  if (unsubHeader) {
    const httpMatch = unsubHeader.match(/<(https?:\/\/[^>]+)>/);
    if (httpMatch) httpUrl = httpMatch[1];
    const mailtoMatch = unsubHeader.match(/<(mailto:[^>]+)>/);
    if (mailtoMatch) mailtoUrl = mailtoMatch[1];
  }

  const hasOneClick =
    !!unsubPostHeader &&
    unsubPostHeader.toLowerCase().includes("list-unsubscribe=one-click");

  return {
    messageId: id,
    subject: msg.subject,
    from: msg.from.email,
    listUnsubscribe: unsubHeader,
    listUnsubscribePost: unsubPostHeader,
    hasOneClick,
    httpUrl,
    mailtoUrl,
  };
}
