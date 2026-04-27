import { useState, useEffect, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../types";
import type { MailMessageDisplay } from "../../InboxReviewView/types";

export function useInboxMessages(postMessage: PostMessage, onMessage: OnMessage) {
  const [messages, setMessages] = useState<MailMessageDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [ipcReady, setIpcReady] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    postMessage({ type: "get-messages", count: 30 });
  }, [postMessage]);

  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === "messages") {
        if (msg.ipcNotReady) {
          setIpcReady(false);
          setLoading(false);
        } else {
          setIpcReady(true);
          setMessages(msg.messages as MailMessageDisplay[]);
          setLoading(false);
        }
      }
      if (msg.type === "ipc-ready") {
        setIpcReady(true);
        refresh();
      }
    });
    refresh();
    return unsub;
  }, [onMessage, refresh]);

  // Timeout fallback
  useEffect(() => {
    const t = setTimeout(() => {
      setIpcReady((prev) => (prev === null ? false : prev));
      setLoading(false);
    }, 20000);
    return () => clearTimeout(t);
  }, []);

  return { messages, loading, ipcReady, refresh };
}
