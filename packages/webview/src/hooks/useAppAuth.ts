import { useState, useEffect, useRef } from "react";
import type { PostMessage, OnMessage, View, AuthChallenge } from "../types";

export function useAppAuth(postMessage: PostMessage, onMessage: OnMessage) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>("home");
  const [pendingChallenge, setPendingChallenge] = useState<AuthChallenge | null>(null);
  const prevLoggedIn = useRef(loggedIn);

  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === "auth-status") {
        const nowLoggedIn = msg.loggedIn as boolean;
        setLoggedIn(nowLoggedIn);
        if (nowLoggedIn) { setPendingChallenge(null); }
        if (nowLoggedIn !== prevLoggedIn.current) {
          prevLoggedIn.current = nowLoggedIn;
          setView("home");
        }
      }
      if (msg.type === "navigate") {
        setView(msg.view as View);
      }
      if (msg.type === "auth-challenge") {
        setPendingChallenge({
          code: msg.code as string,
          uri: msg.uri as string,
          source: msg.source as string | undefined,
          providerId: msg.providerId as string | undefined,
          expiresIn: msg.expiresIn as number | undefined,
        });
        setView("home");
      }
    });
    postMessage({ type: "ready" });
    return unsub;
  }, [onMessage, postMessage]);

  return { loggedIn, view, setView, pendingChallenge };
}
