import type { UnsubscribeInfo } from "../../../types/mail.js";
import type { GraphClient } from "./graph-client.js";

export async function executeUnsubscribe(client: GraphClient, info: UnsubscribeInfo): Promise<string> {
  // Prefer one-click unsubscribe (RFC 8058)
  if (info.hasOneClick && info.httpUrl) {
    const res = await fetch(info.httpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click",
    });
    return `One-click unsubscribe sent to ${info.httpUrl} — status ${res.status}`;
  }

  // Fall back to HTTP GET unsubscribe link
  if (info.httpUrl) {
    const res = await fetch(info.httpUrl, { method: "GET", redirect: "follow" });
    return `Visited unsubscribe URL ${info.httpUrl} — status ${res.status}`;
  }

  // Fall back to mailto unsubscribe
  if (info.mailtoUrl) {
    const mailtoStr = info.mailtoUrl.replace("mailto:", "");
    const [address, queryStr] = mailtoStr.split("?");
    const params = new URLSearchParams(queryStr ?? "");
    const subject = params.get("subject") ?? "Unsubscribe";

    await client.fetch("/me/sendMail", {
      method: "POST",
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "Text", content: "Unsubscribe" },
          toRecipients: [{ emailAddress: { address } }],
        },
      }),
    });
    return `Unsubscribe email sent to ${address}`;
  }

  return "No unsubscribe mechanism found for this message.";
}
