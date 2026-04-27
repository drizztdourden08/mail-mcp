import { useState, useEffect } from "react";
import type { PostMessage, OnMessage, ProviderInfo } from "../types";

export function useProviderRegistry(postMessage: PostMessage, onMessage: OnMessage) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    postMessage({ type: "get-providers" });
    return onMessage((msg) => {
      if (msg.type === "providers") {
        setProviders(msg.providers as ProviderInfo[]);
      }
    });
  }, [postMessage, onMessage]);

  return providers;
}
