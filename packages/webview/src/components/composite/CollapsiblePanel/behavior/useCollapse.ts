import { useState, useCallback } from "react";

export function useCollapse(defaultExpanded = false) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggle = useCallback(() => setExpanded((v) => !v), []);
  return { expanded, toggle };
}
