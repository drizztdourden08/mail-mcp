import Button from "../../primitive/Button/Button";
import Icon from "../../primitive/Icon/Icon";
import Text from "../../primitive/Text/Text";
import type { ProviderInfo } from "../../../types";
import "./ProviderCard.css";

interface Props {
  provider: ProviderInfo;
  onConnect?: (providerId: string) => void;
  onSetup?: (providerId: string) => void;
  connecting?: boolean;
}

export default function ProviderCard({ provider, onConnect, onSetup, connecting }: Props) {
  const showConnect = provider.isConfigured && onConnect;
  const showSetup = !provider.isConfigured && onSetup;

  return (
    <div className="provider-card">
      <Icon svg={provider.svgLogo} size={32} className="provider-card__logo" />
      <div className="provider-card__info">
        <span className="provider-card__name">{provider.name}</span>
        <Text variant="description" className="provider-card__strategy">
          {provider.isConfigured
            ? provider.authStrategy === "device-code" && "Device code sign-in"
              || provider.authStrategy === "oauth-redirect" && "OAuth sign-in"
              || provider.authStrategy === "api-key" && "API key"
            : "Requires setup"}
        </Text>
      </div>
      {showConnect && (
        <Button
          variant="primary"
          onClick={() => onConnect(provider.id)}
          disabled={connecting}
        >
          {connecting ? "Connecting…" : "Connect"}
        </Button>
      )}
      {showSetup && (
        <Button
          variant="secondary"
          onClick={() => onSetup(provider.id)}
        >
          Setup
        </Button>
      )}
    </div>
  );
}
