import Text from "../../components/primitive/Text/Text";
import Button from "../../components/primitive/Button/Button";
import ProviderCard from "../../components/compound/ProviderCard/ProviderCard";
import DeviceCodeAuth from "../../components/compound/DeviceCodeAuth/DeviceCodeAuth";
import { useLoginFlow } from "./behavior/useLoginFlow";
import type { PostMessage, OnMessage, AuthChallenge, ProviderInfo } from "../../types";
import "./LoginView.css";

interface Props {
  postMessage: PostMessage;
  onMessage: OnMessage;
  initialChallenge: AuthChallenge | null;
  providers: ProviderInfo[];
  onNavigateSetup: (providerId: string) => void;
}

export default function LoginView({ postMessage, onMessage, initialChallenge, providers, onNavigateSetup }: Props) {
  const { status, challenge, error, connectingProvider, connect, retry, cancel } =
    useLoginFlow(postMessage, onMessage, initialChallenge);

  return (
    <div className="login-view">
      {(status === "idle" || status === "error") && (
        <Text>Sign in to a provider to manage your emails.</Text>
      )}

      {status === "idle" && providers.length > 0 && (
        <div className="login-view__providers">
          {providers.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onConnect={connect}
              onSetup={onNavigateSetup}
              connecting={connectingProvider === p.id}
            />
          ))}
        </div>
      )}

      {status === "idle" && providers.length === 0 && (
        <Text variant="hint">
          No providers available. Start the MCP server to see providers.
        </Text>
      )}

      {(status === "connecting" || status === "waiting") && (
        <>
          <DeviceCodeAuth
            challenge={challenge}
            postMessage={postMessage}
            waiting={status === "connecting"}
          />
          <Button variant="ghost" onClick={cancel} style={{ marginTop: 12 }}>Cancel</Button>
        </>
      )}

      {status === "error" && (
        <div className="login-view__error">
          <Text variant="error">Sign in failed: {error}</Text>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}
    </div>
  );
}
