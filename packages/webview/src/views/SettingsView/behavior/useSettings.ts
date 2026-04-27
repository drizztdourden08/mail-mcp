import { useState, useEffect, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../types";
import type { SettingsData } from "../types";

export function useSettings(postMessage: PostMessage, onMessage: OnMessage) {
  const [settings, setSettings] = useState<SettingsData>({
    autoCopyCode: true,
    autoOpenBrowser: true,
    focusOnReview: true,
  });

  useEffect(() => {
    postMessage({ type: "get-settings" });
    return onMessage((msg) => {
      if (msg.type === "settings") {
        setSettings({
          autoCopyCode: msg.autoCopyCode as boolean,
          autoOpenBrowser: msg.autoOpenBrowser as boolean,
          focusOnReview: msg.focusOnReview as boolean,
        });
      }
    });
  }, [onMessage, postMessage]);

  const update = useCallback(
    (key: keyof SettingsData, value: boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      postMessage({ type: "set-setting", key, value });
    },
    [postMessage],
  );

  return { settings, update };
}
