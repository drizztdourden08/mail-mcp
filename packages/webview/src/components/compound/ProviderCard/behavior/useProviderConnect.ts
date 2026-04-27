import { useCallback } from "react";
import type { PostMessage } from "../../../../types";

export function useProviderConnect(postMessage: PostMessage) {
  const connect = useCallback(
    (providerId: string) => {
      postMessage({ type: "login", providerId });
    },
    [postMessage],
  );
  return connect;
}
