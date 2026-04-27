import type { CachedMessage, SearchOptions } from "../../types/cache.js";

export function searchStore(messages: CachedMessage[], opts: SearchOptions): CachedMessage[] {
  const { query, field = "all", regex = false } = opts;
  if (!query) return messages;

  let matcher: (text: string) => boolean;
  if (regex) {
    try {
      const re = new RegExp(query, "i");
      matcher = (text) => re.test(text);
    } catch {
      const lower = query.toLowerCase();
      matcher = (text) => text.toLowerCase().includes(lower);
    }
  } else {
    const lower = query.toLowerCase();
    matcher = (text) => text.toLowerCase().includes(lower);
  }

  return messages.filter((msg) => {
    switch (field) {
      case "subject": return matcher(msg.subject);
      case "body": return matcher(msg.bodyText);
      case "from": return matcher(msg.from);
      case "all":
      default:
        return matcher(msg.subject) || matcher(msg.bodyText) || matcher(msg.from);
    }
  });
}
