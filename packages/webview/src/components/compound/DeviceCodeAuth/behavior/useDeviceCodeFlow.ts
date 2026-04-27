import { useState, useCallback, useRef, useEffect } from "react";
import type { PostMessage } from "../../../../types";

export function useDeviceCodeFlow(postMessage: PostMessage) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copyCode = useCallback(
    (code: string) => {
      postMessage({ type: "copy-to-clipboard", text: code });
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    },
    [postMessage],
  );

  const openUrl = useCallback(
    (url: string) => {
      postMessage({ type: "open-url", url });
    },
    [postMessage],
  );

  return { copied, copyCode, openUrl };
}
