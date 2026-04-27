import { useState, useCallback, useMemo } from "react";

export function useReviewFilter(items: { id: string; fields: Record<string, string> }[]) {
  const [filterText, setFilterText] = useState("");

  const filtered = useMemo(() => {
    if (!filterText.trim()) return items;
    const lower = filterText.toLowerCase();
    return items.filter((item) =>
      Object.values(item.fields).some((v) => v.toLowerCase().includes(lower)),
    );
  }, [items, filterText]);

  const clearFilter = useCallback(() => setFilterText(""), []);

  return { filterText, setFilterText, filtered, clearFilter };
}
