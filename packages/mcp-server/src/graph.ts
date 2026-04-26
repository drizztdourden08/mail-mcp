import { getAccessToken, type DeviceCodeInfo } from "./auth.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphFetch(
  path: string,
  options: RequestInit = {},
  onDeviceCode?: (info: DeviceCodeInfo) => void
): Promise<Response> {
  const token = await getAccessToken(onDeviceCode);
  const url = path.startsWith("http") ? path : `${GRAPH_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Graph API error ${response.status}: ${body}`);
  }
  return response;
}

export interface MailMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  isRead: boolean;
  from?: {
    emailAddress: { name: string; address: string };
  };
  body?: { contentType: string; content: string };
  internetMessageHeaders?: Array<{ name: string; value: string }>;
}

export interface MailFolder {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
}

export async function listMessages(
  folder: string = "Inbox",
  top: number = 20,
  filter?: string
): Promise<MailMessage[]> {
  const params = new URLSearchParams({
    $top: String(top),
    $select: "id,subject,bodyPreview,receivedDateTime,isRead,from",
    $orderby: "receivedDateTime desc",
  });
  if (filter) params.set("$filter", filter);

  const res = await graphFetch(`/me/mailFolders/${folder}/messages?${params}`);
  const data = await res.json() as { value: MailMessage[] };
  return data.value;
}

export async function getMessage(id: string): Promise<MailMessage> {
  const params = new URLSearchParams({
    $select: "id,subject,body,bodyPreview,receivedDateTime,isRead,from,internetMessageHeaders",
  });
  const res = await graphFetch(`/me/messages/${encodeURIComponent(id)}?${params}`);
  return res.json() as Promise<MailMessage>;
}

export async function deleteMessage(id: string): Promise<void> {
  await graphFetch(`/me/messages/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function moveMessage(id: string, destinationFolder: string): Promise<MailMessage> {
  const res = await graphFetch(`/me/messages/${encodeURIComponent(id)}/move`, {
    method: "POST",
    body: JSON.stringify({ destinationId: destinationFolder }),
  });
  return res.json() as Promise<MailMessage>;
}

export async function listFolders(): Promise<MailFolder[]> {
  const params = new URLSearchParams({
    $select: "id,displayName,totalItemCount,unreadItemCount",
    $top: "50",
  });
  const res = await graphFetch(`/me/mailFolders?${params}`);
  const data = await res.json() as { value: MailFolder[] };
  return data.value;
}

export async function searchMessages(query: string, top: number = 20): Promise<MailMessage[]> {
  const params = new URLSearchParams({
    $search: `"${query}"`,
    $top: String(top),
    $select: "id,subject,bodyPreview,receivedDateTime,isRead,from",
  });
  const res = await graphFetch(`/me/messages?${params}`);
  const data = await res.json() as { value: MailMessage[] };
  return data.value;
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

export async function getUnsubscribeInfo(id: string): Promise<UnsubscribeInfo> {
  const msg = await getMessage(id);
  const headers = msg.internetMessageHeaders ?? [];

  const unsubHeader = headers.find(
    (h) => h.name.toLowerCase() === "list-unsubscribe"
  )?.value ?? null;

  const unsubPostHeader = headers.find(
    (h) => h.name.toLowerCase() === "list-unsubscribe-post"
  )?.value ?? null;

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
    from: msg.from?.emailAddress?.address ?? "unknown",
    listUnsubscribe: unsubHeader,
    listUnsubscribePost: unsubPostHeader,
    hasOneClick,
    httpUrl,
    mailtoUrl,
  };
}

export async function executeUnsubscribe(info: UnsubscribeInfo): Promise<string> {
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

    await graphFetch("/me/sendMail", {
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
