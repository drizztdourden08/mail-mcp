import { useState, useEffect, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../types";
import type { UnsubscribeInfo } from "../types";

interface MailMessage {
  id: string;
  subject: string;
  from?: { emailAddress: { name: string; address: string } };
}

export function useUnsubscribeCheck(postMessage: PostMessage, onMessage: OnMessage) {
  const [unsubInfo, setUnsubInfo] = useState<Map<string, UnsubscribeInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setUnsubInfo(new Map());
    postMessage({ type: "get-messages", count: 50 });
  }, [postMessage]);

  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === "messages") {
        setLoading(false);
        setChecking(true);
        for (const m of msg.messages as MailMessage[]) {
          postMessage({ type: "check-unsubscribe", id: m.id });
        }
      }
      if (msg.type === "unsubscribe-info") {
        const info = msg.info as UnsubscribeInfo;
        setUnsubInfo((prev) => {
          const next = new Map(prev);
          if (info.listUnsubscribe) next.set(info.messageId, info);
          return next;
        });
        setChecking(false);
      }
      if (msg.type === "error") {
        setChecking(false);
      }
    });
    refresh();
    return unsub;
  }, [onMessage, refresh, postMessage]);

  const unsubList = [...unsubInfo.values()];
  return { unsubList, loading, checking, refresh };
}
