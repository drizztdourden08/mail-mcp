import { useState, useEffect, useCallback, useRef } from "react";
import type { PostMessage, OnMessage } from "../../../types";

export function useCustomInstructions(postMessage: PostMessage, onMessage: OnMessage) {
  const [defaultInstructions, setDefaultInstructions] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocalEdit = useRef(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    postMessage({ type: "get-instructions" });
    postMessage({ type: "get-custom-instructions" });
    return onMessage((msg) => {
      if (msg.type === "instructions") {
        setDefaultInstructions(msg.content as string);
      }
      if (msg.type === "custom-instructions") {
        if (!isLocalEdit.current) {
          setCustomInstructions(msg.content as string);
        }
      }
    });
  }, [onMessage, postMessage]);

  const save = useCallback((content: string) => {
    postMessage({ type: "set-custom-instructions", content });
    setSavedMsg("Saved");
    setTimeout(() => setSavedMsg(""), 1500);
    setTimeout(() => { isLocalEdit.current = false; }, 200);
  }, [postMessage]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    isLocalEdit.current = true;
    setCustomInstructions(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(val), 800);
  }, [save]);

  return { defaultInstructions, customInstructions, onChange, savedMsg };
}
