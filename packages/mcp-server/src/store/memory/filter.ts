import type { CachedMessage, FilterOptions } from "../../types/cache.js";

export function filterStore(messages: CachedMessage[], opts: FilterOptions): CachedMessage[] {
  let result = messages;

  if (opts.hasUnsubscribe !== undefined) {
    result = result.filter(m => m.hasUnsubscribe === opts.hasUnsubscribe);
  }
  if (opts.isRead !== undefined) {
    result = result.filter(m => m.isRead === opts.isRead);
  }
  if (opts.fromPattern) {
    const lower = opts.fromPattern.toLowerCase();
    result = result.filter(m => m.from.toLowerCase().includes(lower));
  }
  if (opts.afterDate) {
    const after = new Date(opts.afterDate).getTime();
    result = result.filter(m => new Date(m.date).getTime() >= after);
  }
  if (opts.beforeDate) {
    const before = new Date(opts.beforeDate).getTime();
    result = result.filter(m => new Date(m.date).getTime() <= before);
  }

  return result;
}
