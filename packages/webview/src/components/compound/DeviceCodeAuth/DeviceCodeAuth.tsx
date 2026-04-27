import { useState, useEffect, useRef } from "react";
import CodeDisplay from "../../primitive/CodeDisplay/CodeDisplay";
import Button from "../../primitive/Button/Button";
import Text from "../../primitive/Text/Text";
import Spinner from "../../primitive/Spinner/Spinner";
import { useDeviceCodeFlow } from "./behavior/useDeviceCodeFlow";
import type { DeviceCodeChallenge } from "./types";
import type { PostMessage } from "../../../types";
import "./DeviceCodeAuth.css";

interface Props {
  challenge: DeviceCodeChallenge | null;
  postMessage: PostMessage;
  waiting?: boolean;
}

function useCountdown(expiresIn: number | undefined) {
  const [remaining, setRemaining] = useState<number | null>(expiresIn ?? null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!expiresIn) return;
    startRef.current = Date.now();
    setRemaining(expiresIn);
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const left = expiresIn - elapsed;
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresIn]);

  return remaining;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DeviceCodeAuth({ challenge, postMessage, waiting }: Props) {
  const { copied, copyCode, openUrl } = useDeviceCodeFlow(postMessage);
  const remaining = useCountdown(challenge?.expiresIn);

  if (waiting && !challenge) {
    return (
      <div className="device-code-auth">
        <Spinner size="sm" />
        <Text variant="waiting">Connecting…</Text>
      </div>
    );
  }

  if (!challenge) return null;

  const expired = remaining === 0;

  return (
    <div className="device-code-auth">
      {challenge.source === "mcp" ? (
        <Text>A sign-in was initiated from Copilot chat. Enter this code in the browser:</Text>
      ) : (
        <Text>Enter this code in the browser window that just opened:</Text>
      )}

      <CodeDisplay
        code={challenge.code}
        onCopy={() => copyCode(challenge.code)}
        copied={copied}
      />

      <Button onClick={() => openUrl(challenge.uri)} style={{ marginTop: 12 }}>
        Open Browser
      </Button>
      <Text variant="hint" style={{ marginTop: 4, fontSize: "0.8em" }}>
        {challenge.uri}
      </Text>

      <div className="device-code-auth__status">
        {expired ? (
          <Text variant="error">Code expired. Please try again.</Text>
        ) : (
          <>
            <Spinner size="sm" />
            <Text variant="waiting">Waiting for sign in…</Text>
            {remaining != null && (
              <Text variant="hint" className="device-code-auth__countdown">
                {formatTime(remaining)}
              </Text>
            )}
          </>
        )}
      </div>
    </div>
  );
}
