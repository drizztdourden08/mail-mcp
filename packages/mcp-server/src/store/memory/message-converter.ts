import type { MailMessage } from "../../types/mail.js";
import type { CachedMessage } from "../../types/cache.js";

export function parseUnsubscribe(headers: Record<string, string>) {
  const unsub = headers["list-unsubscribe"] ?? null;
  const unsubPost = headers["list-unsubscribe-post"] ?? null;

  let httpUrl: string | null = null;
  let mailtoUrl: string | null = null;

  if (unsub) {
    const httpMatch = unsub.match(/<(https?:\/\/[^>]+)>/);
    if (httpMatch) httpUrl = httpMatch[1];
    const mailtoMatch = unsub.match(/<(mailto:[^>]+)>/);
    if (mailtoMatch) mailtoUrl = mailtoMatch[1];
  }

  const hasOneClick =
    !!unsubPost && unsubPost.toLowerCase().includes("list-unsubscribe=one-click");

  return { hasUnsubscribe: !!unsub, httpUrl, mailtoUrl, hasOneClick };
}

export function mailToCached(msg: MailMessage): CachedMessage {
  const unsub = parseUnsubscribe(msg.headers ?? {});

  return {
    id: msg.id,
    subject: msg.subject,
    from: msg.from.email,
    date: msg.date,
    bodyPreview: msg.preview,
    bodyText: msg.body?.text ?? msg.preview,
    isRead: msg.isRead,
    headers: msg.headers ?? {},
    hasUnsubscribe: unsub.hasUnsubscribe,
    unsubscribeHttpUrl: unsub.httpUrl,
    unsubscribeMailto: unsub.mailtoUrl,
    hasOneClick: unsub.hasOneClick,
  };
}
