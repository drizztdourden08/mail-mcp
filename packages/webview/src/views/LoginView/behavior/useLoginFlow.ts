import { useState, useEffect, useCallback } from "react";
import type { PostMessage, OnMessage, ProviderInfo, AuthChallenge } from "../../../types";
import type { LoginStatus } from "../types";

export function useLoginFlow(postMessage: PostMessage, onMessage: OnMessage, initialChallenge: AuthChallenge | null) {
  const [status, setStatus] = useState<LoginStatus>(initialChallenge ? "waiting" : "idle");
  const [challenge, setChallenge] = useState<AuthChallenge | null>(initialChallenge);
  const [error, setError] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  useEffect(() => {
    postMessage({ type: "get-auth-challenge" });
  }, [postMessage]);

  useEffect(() => {
    if (initialChallenge) {
      setStatus("waiting");
      setChallenge(initialChallenge);
    }
  }, [initialChallenge]);

  useEffect(() => {
    return onMessage((msg) => {
      if (msg.type === "auth-challenge") {
        setStatus("waiting");
        setChallenge({
          code: msg.code as string,
          uri: msg.uri as string,
          source: msg.source as string | undefined,
          providerId: msg.providerId as string | undefined,
          expiresIn: msg.expiresIn as number | undefined,
        });
      }
      if (msg.type === "auth-error") {
        setStatus("error");
        setError(msg.error as string);
        setConnectingProvider(null);
      }
      if (msg.type === "auth-status" && msg.loggedIn) {
        setStatus("idle");
        setChallenge(null);
        setConnectingProvider(null);
      }
    });
  }, [onMessage]);

  const connect = useCallback(
    (providerId: string) => {
      setStatus("connecting");
      setError(null);
      setConnectingProvider(providerId);
      postMessage({ type: "login", providerId });
    },
    [postMessage],
  );

  const retry = useCallback(() => {
    if (connectingProvider) {
      connect(connectingProvider);
    }
  }, [connect, connectingProvider]);

  const cancel = useCallback(() => {
    setStatus("idle");
    setChallenge(null);
    setConnectingProvider(null);
    setError(null);
  }, []);

  return { status, challenge, error, connectingProvider, connect, retry, cancel };
}
