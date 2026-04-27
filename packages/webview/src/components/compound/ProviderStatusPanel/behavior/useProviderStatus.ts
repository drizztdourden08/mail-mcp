import { useState, useEffect, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../../types";
import type { ProviderStatusData } from "../types";

export function useProviderStatus(postMessage: PostMessage, onMessage: OnMessage) {
  const [providers, setProviders] = useState<ProviderStatusData[]>([]);

  useEffect(() => {
    return onMessage((msg) => {
      if (msg.type === "auth-status") {
        console.log(`[dbg] ProviderStatusPanel: auth-status loggedIn=${msg.loggedIn}, providerId=${msg.providerId}`);
        try { (window as any).__vscodeApi?.postMessage({ type: "debug-log", args: [`ProviderStatusPanel: auth-status update loggedIn=${msg.loggedIn}`] }); } catch {}
        setProviders((prev) => {
          // Update or add provider status
          const providerId = (msg.providerId as string) ?? "exchange";
          const existing = prev.find((p) => p.providerId === providerId);
          const entry: ProviderStatusData = {
            providerId,
            providerName: (msg.providerName as string) ?? "Exchange",
            loggedIn: msg.loggedIn as boolean,
            account: msg.account as string | undefined,
          };
          if (existing) {
            return prev.map((p) => (p.providerId === providerId ? entry : p));
          }
          return [...prev, entry];
        });
      }
    });
  }, [onMessage]);

  return providers;
}
