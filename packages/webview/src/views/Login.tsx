import { useState, useEffect } from "react";

interface Props {
  postMessage: (msg: unknown) => void;
  onMessage: (handler: (msg: Record<string, unknown>) => void) => () => void;
}

export default function Login({ postMessage, onMessage }: Props) {
  const [status, setStatus] = useState<"idle" | "waiting" | "error">("idle");
  const [deviceCode, setDeviceCode] = useState<{ userCode: string; verificationUri: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onMessage((msg) => {
      if (msg.type === "device-code") {
        setStatus("waiting");
        setDeviceCode({
          userCode: msg.userCode as string,
          verificationUri: msg.verificationUri as string,
        });
      }
      if (msg.type === "auth-error") {
        setStatus("error");
        setError(msg.error as string);
      }
    });
  }, [onMessage]);

  const handleLogin = () => {
    setStatus("waiting");
    setError(null);
    postMessage({ type: "login" });
  };

  return (
    <div className="login-view">
      <h2>Outlook MCP</h2>
      <p>Sign in with your Microsoft account to manage your emails.</p>

      {status === "idle" && (
        <button className="primary" onClick={handleLogin}>
          Sign in with Microsoft
        </button>
      )}

      {status === "waiting" && deviceCode && (
        <div className="device-code">
          <p>Enter this code in the browser window that just opened:</p>
          <div className="code">{deviceCode.userCode}</div>
          <p className="hint">
            If the browser didn't open, go to{" "}
            <a href={deviceCode.verificationUri}>{deviceCode.verificationUri}</a>
          </p>
          <p className="waiting">Waiting for sign in...</p>
        </div>
      )}

      {status === "waiting" && !deviceCode && (
        <p className="waiting">Connecting to Microsoft...</p>
      )}

      {status === "error" && (
        <div className="error">
          <p>Sign in failed: {error}</p>
          <button onClick={handleLogin}>Try again</button>
        </div>
      )}
    </div>
  );
}
