import { useState, useCallback } from "react";

export function useReviewSelection(initialIds: string[] = []) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((allIds: string[]) => {
    setSelected((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds),
    );
  }, []);

  return { selected, toggle, selectAll, setSelected };
}
