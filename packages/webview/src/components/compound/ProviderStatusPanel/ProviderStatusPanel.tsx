import CollapsiblePanel from "../../composite/CollapsiblePanel/CollapsiblePanel";
import DataRow from "../../composite/DataRow/DataRow";
import { useProviderStatus } from "./behavior/useProviderStatus";
import type { PostMessage, OnMessage } from "../../../types";
import "./ProviderStatusPanel.css";

interface Props {
  postMessage: PostMessage;
  onMessage: OnMessage;
}

export default function ProviderStatusPanel({ postMessage, onMessage }: Props) {
  const providers = useProviderStatus(postMessage, onMessage);
  const anyConnected = providers.some((p) => p.loggedIn);
  const summary = providers.length === 0
    ? "No providers"
    : providers.map((p) => `${p.providerName}: ${p.loggedIn ? "connected" : "disconnected"}`).join(", ");

  return (
    <CollapsiblePanel
      title="Providers"
      statusColor={anyConnected ? "green" : "gray"}
      statusGlow={anyConnected}
      summary={summary}
      className="provider-status-panel"
    >
      {providers.length === 0 ? (
        <p className="provider-status-panel__empty">No providers connected.</p>
      ) : (
        <div className="provider-status-panel__list">
          {providers.map((p) => (
            <DataRow
              key={p.providerId}
              label={p.providerName}
              value={p.loggedIn ? (p.account ?? "Connected") : "Disconnected"}
            />
          ))}
        </div>
      )}
    </CollapsiblePanel>
  );
}
