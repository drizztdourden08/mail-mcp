import { useState, useCallback } from "react";
import Text from "../../components/primitive/Text/Text";
import Title from "../../components/primitive/Title/Title";
import Button from "../../components/primitive/Button/Button";
import Icon from "../../components/primitive/Icon/Icon";
import Markdown from "../../components/primitive/Markdown/Markdown";
import type { ProviderInfo } from "../../types";
import "./SetupView.css";

interface Props {
  providers: ProviderInfo[];
  initialProviderId?: string | null;
}

export default function SetupView({ providers, initialProviderId }: Props) {
  const [activeId, setActiveId] = useState<string | null>(initialProviderId ?? null);
  const activeProvider = activeId ? providers.find((p) => p.id === activeId) ?? null : null;

  const goBack = useCallback(() => setActiveId(null), []);

  if (providers.length === 0) {
    return (
      <div className="setup-view">
        <Text variant="hint">No providers registered. Start the MCP server to see setup instructions.</Text>
      </div>
    );
  }

  // Detail view — show setup docs for selected provider
  if (activeProvider) {
    return (
      <div className="setup-view">
        <div className="setup-view__header">
          <Button variant="ghost" onClick={goBack} className="setup-view__back">← Back</Button>
        </div>
        {activeProvider.setupMarkdown ? (
          <Markdown content={activeProvider.setupMarkdown} className="setup-view__content" />
        ) : (
          <Text variant="hint">No setup documentation available for {activeProvider.name}.</Text>
        )}
      </div>
    );
  }

  // Landing page — list of providers
  return (
    <div className="setup-view">
      <Title level={3}>Provider Setup</Title>
      <Text>Select a provider to view setup instructions.</Text>
      <div className="setup-view__list">
        {providers.map((p) => (
          <div key={p.id} className="setup-view__provider-row" onClick={() => setActiveId(p.id)}>
            <Icon svg={p.svgLogo} size={28} className="setup-view__provider-icon" />
            <div className="setup-view__provider-info">
              <span className="setup-view__provider-name">{p.name}</span>
              <Text variant="description">
                {p.isConfigured ? "Configured ✓" : "Needs setup"}
              </Text>
            </div>
            <span className="setup-view__chevron">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
