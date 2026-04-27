import { useCallback } from "react";

export function useCopyToClipboard(postMessage: (msg: unknown) => void) {
  const copy = useCallback(
    (text: string) => {
      postMessage({ type: "copy-to-clipboard", text });
    },
    [postMessage],
  );
  return copy;
}
