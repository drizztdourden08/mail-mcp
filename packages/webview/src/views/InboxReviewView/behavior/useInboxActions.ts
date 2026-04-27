import { useState, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../types";

export function useInboxActions(postMessage: PostMessage, onMessage: OnMessage, onDone: () => void) {
  const [actionResult, setActionResult] = useState<string | null>(null);

  const clearResult = useCallback(() => setActionResult(null), []);

  const deleteMessages = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      postMessage({ type: "delete-messages", ids });
    },
    [postMessage],
  );

  const moveMessages = useCallback(
    (ids: string[], folder: string) => {
      if (ids.length === 0) return;
      postMessage({ type: "move-messages", ids, folder });
    },
    [postMessage],
  );

  // Listen for results
  const handleMessages = useCallback(
    (msg: Record<string, unknown>) => {
      if (msg.type === "action-result") {
        const results = msg.results as string[];
        setActionResult(results.join("\n"));
        onDone();
      }
      if (msg.type === "error") {
        setActionResult(`Error: ${msg.error}`);
      }
    },
    [onDone],
  );

  return { actionResult, clearResult, deleteMessages, moveMessages, handleMessages };
}
