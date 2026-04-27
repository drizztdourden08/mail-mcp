import { useState, useCallback } from "react";

export function useActiveTab(initialId: string | null = null) {
  const [activeId, setActiveId] = useState<string | null>(initialId);
  const select = useCallback((id: string) => setActiveId(id), []);
  return { activeId, select, setActiveId };
}
