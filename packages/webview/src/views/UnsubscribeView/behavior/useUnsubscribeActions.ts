import { useState, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../types";

export function useUnsubscribeActions(postMessage: PostMessage, onMessage: OnMessage) {
  const [actionResult, setActionResult] = useState<string | null>(null);

  const clearResult = useCallback(() => setActionResult(null), []);

  const unsubscribe = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      postMessage({ type: "unsubscribe", ids });
    },
    [postMessage],
  );

  return { actionResult, setActionResult, clearResult, unsubscribe };
}
