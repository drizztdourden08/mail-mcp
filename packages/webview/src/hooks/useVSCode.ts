import { useEffect, useRef, useCallback } from "react";

const vscodeApi = acquireVsCodeApi();

type MessageHandler = (msg: Record<string, unknown>) => void;

export function useVSCode() {
  const handlers = useRef<Set<MessageHandler>>(new Set());

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const msg = event.data;
      handlers.current.forEach((h) => h(msg));
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  const onMessage = useCallback((handler: MessageHandler) => {
    handlers.current.add(handler);
    return () => { handlers.current.delete(handler); };
  }, []);

  const postMessage = useCallback((message: unknown) => {
    vscodeApi.postMessage(message);
  }, []);

  return { postMessage, onMessage };
}
