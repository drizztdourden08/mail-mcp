import { useState, useCallback } from "react";
import Text from "../../components/primitive/Text/Text";
import Title from "../../components/primitive/Title/Title";
import Button from "../../components/primitive/Button/Button";
import Icon from "../../components/primitive/Icon/Icon";
import Markdown from "../../components/primitive/Markdown/Markdown";
import { docSections } from "../../docs";
import type { ProviderInfo } from "../../types";
import "./DocsView.css";

interface Props {
  providers: ProviderInfo[];
  initialProviderId?: string | null;
}

type ActivePage =
  | { type: "toc" }
  | { type: "doc"; sectionId: string }
  | { type: "provider"; providerId: string };

export default function DocsView({ providers, initialProviderId }: Props) {
  const [activePage, setActivePage] = useState<ActivePage>(
    initialProviderId
      ? { type: "provider", providerId: initialProviderId }
      : { type: "toc" }
  );

  const goBack = useCallback(() => setActivePage({ type: "toc" }), []);

  // ── Doc detail page ──
  if (activePage.type === "doc") {
    const section = docSections.find((s) => s.id === activePage.sectionId);
    return (
      <div className="docs-view">
        <div className="docs-view__header">
          <Button variant="ghost" onClick={goBack} className="docs-view__back">← Back</Button>
        </div>
        {section ? (
          <Markdown content={section.content} className="docs-view__content" />
        ) : (
          <Text variant="hint">Section not found.</Text>
        )}
      </div>
    );
  }

  // ── Provider setup detail page ──
  if (activePage.type === "provider") {
    const provider = providers.find((p) => p.id === activePage.providerId);
    return (
      <div className="docs-view">
        <div className="docs-view__header">
          <Button variant="ghost" onClick={goBack} className="docs-view__back">← Back</Button>
        </div>
        {provider?.setupMarkdown ? (
          <Markdown content={provider.setupMarkdown} className="docs-view__content" />
        ) : (
          <Text variant="hint">No setup documentation available{provider ? ` for ${provider.name}` : ""}.</Text>
        )}
      </div>
    );
  }

  // ── Table of contents ──
  return (
    <div className="docs-view">
      {/* Documentation section */}
      <Title level={3}>Documentation</Title>
      <Text variant="description">Learn about Mail MCP, its capabilities, and how to use it.</Text>
      <div className="docs-view__list">
        {docSections.map((section) => (
          <div
            key={section.id}
            className="docs-view__row"
            onClick={() => setActivePage({ type: "doc", sectionId: section.id })}
          >
            <span className="docs-view__row-icon">📄</span>
            <span className="docs-view__row-label">{section.title}</span>
            <span className="docs-view__chevron">›</span>
          </div>
        ))}
      </div>

      {/* Provider Setup section */}
      {providers.length > 0 && (
        <>
          <Title level={3} className="docs-view__section-title">Provider Setup</Title>
          <Text variant="description">Configure email providers for Mail MCP.</Text>
          <div className="docs-view__list">
            {providers.map((p) => (
              <div
                key={p.id}
                className="docs-view__row"
                onClick={() => setActivePage({ type: "provider", providerId: p.id })}
              >
                <Icon svg={p.svgLogo} size={22} className="docs-view__provider-icon" />
                <div className="docs-view__provider-info">
                  <span className="docs-view__row-label">{p.name}</span>
                  <Text variant="description">
                    {p.isConfigured ? "Configured ✓" : "Needs setup"}
                  </Text>
                </div>
                <span className="docs-view__chevron">›</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
