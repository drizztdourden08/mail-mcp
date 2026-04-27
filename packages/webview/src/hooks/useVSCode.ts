import { useEffect, useRef, useCallback } from "react";

const vscodeApi = acquireVsCodeApi();
// Expose globally so non-React code (markdown parser) can forward debug logs
(window as any).__vscodeApi = vscodeApi;

type MessageHandler = (msg: Record<string, unknown>) => void;

export function useVSCode() {
  const handlers = useRef<Set<MessageHandler>>(new Set());

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const msg = event.data;
      if (msg && msg.type && msg.type !== "debug-log") {
        console.log(`[dbg] ext→wv message: ${msg.type}`);
      }
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
