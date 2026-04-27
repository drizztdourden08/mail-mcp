import { useState, useEffect, useRef, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../types";
import type { Review } from "../types";

export function useReviewTabs(postMessage: PostMessage, onMessage: OnMessage) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const knownIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const poll = () => postMessage({ type: "get-reviews" });
    poll();
    const iv = setInterval(poll, 2000);
    return () => clearInterval(iv);
  }, [postMessage]);

  useEffect(() => {
    return onMessage((msg) => {
      if (msg.type === "reviews") {
        const incoming = msg.reviews as Review[];
        setReviews(incoming);

        const hasNew = incoming.some((r) => !knownIdsRef.current.has(r.id));
        knownIdsRef.current = new Set(incoming.map((r) => r.id));
        if (hasNew) {
          postMessage({ type: "focus-panel" });
        }

        if (incoming.length > 0) {
          setActiveTab((prev) => {
            if (prev && incoming.some((r) => r.id === prev)) return prev;
            return incoming[0].id;
          });
        } else {
          setActiveTab(null);
        }
      }
    });
  }, [onMessage, postMessage]);

  const approve = useCallback(
    (reviewId: string, selectedIds: string[]) => {
      postMessage({ type: "review-respond", id: reviewId, approved: true, selectedIds });
    },
    [postMessage],
  );

  const reject = useCallback(
    (reviewId: string) => {
      postMessage({ type: "review-respond", id: reviewId, approved: false, selectedIds: [] });
    },
    [postMessage],
  );

  return { reviews, activeTab, setActiveTab, approve, reject };
}
