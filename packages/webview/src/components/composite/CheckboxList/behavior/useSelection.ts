import { useState, useCallback } from "react";

export function useSelection(initialIds: string[] = []) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, toggle, selectAll, clear, setSelected };
}
