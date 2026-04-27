import { useState, useEffect, useCallback } from "react";
import type { PostMessage, OnMessage, ProviderInfo } from "../../../types";

export function useProviderConfig(postMessage: PostMessage, onMessage: OnMessage) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    postMessage({ type: "get-providers" });
    postMessage({ type: "get-settings" }); // triggers provider-config push
    return onMessage((msg) => {
      if (msg.type === "providers") {
        setProviders(msg.providers as ProviderInfo[]);
      }
      if (msg.type === "provider-config") {
        setConfig(msg.config as Record<string, string>);
      }
    });
  }, [onMessage, postMessage]);

  const updateField = useCallback(
    (providerId: string, fieldKey: string, value: string) => {
      const key = `${providerId}.${fieldKey}`;
      setConfig((prev) => ({ ...prev, [key]: value }));
      postMessage({ type: "set-provider-config", key, value });
    },
    [postMessage],
  );

  return { providers, config, updateField };
}
