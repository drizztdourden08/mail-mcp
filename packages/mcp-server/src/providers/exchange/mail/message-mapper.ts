import type { MailMessage } from "../../../types/mail.js";

/** Raw shape returned by Microsoft Graph API */
export interface GraphMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  isRead: boolean;
  from?: { emailAddress: { name: string; address: string } };
  body?: { contentType: string; content: string };
  internetMessageHeaders?: Array<{ name: string; value: string }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Convert a Microsoft Graph mail message to our provider-agnostic MailMessage. */
export function mapGraphMessage(m: GraphMessage): MailMessage {
  const result: MailMessage = {
    id: m.id,
    subject: m.subject,
    preview: m.bodyPreview,
    from: {
      email: m.from?.emailAddress?.address ?? "",
      name: m.from?.emailAddress?.name ?? "",
    },
    date: m.receivedDateTime,
    isRead: m.isRead,
  };

  if (m.body) {
    result.body = {
      text: m.body.contentType === "text" ? m.body.content : stripHtml(m.body.content),
      html: m.body.contentType === "html" ? m.body.content : undefined,
    };
  }

  if (m.internetMessageHeaders) {
    result.headers = {};
    for (const h of m.internetMessageHeaders) {
      result.headers[h.name.toLowerCase()] = h.value;
    }
  }

  return result;
}
