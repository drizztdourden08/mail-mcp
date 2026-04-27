import { useEffect, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../../types";
import type { Review } from "../types";

export function useReviewPolling(postMessage: PostMessage, onMessage: OnMessage) {
  const poll = useCallback(() => {
    postMessage({ type: "get-reviews" });
  }, [postMessage]);

  useEffect(() => {
    poll();
    const iv = setInterval(poll, 2000);
    return () => clearInterval(iv);
  }, [poll]);

  useEffect(() => {
    return onMessage((msg) => {
      // handled externally
    });
  }, [onMessage]);

  return { poll };
}
