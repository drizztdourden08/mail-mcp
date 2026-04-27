import { useState, useCallback } from "react";
import { useVSCode } from "./hooks/useVSCode";
import { useAppAuth } from "./hooks/useAppAuth";
import { useProviderRegistry } from "./hooks/useProviderRegistry";
import NavBar from "./components/composite/NavBar/NavBar";
import McpStatusPanel from "./components/compound/McpStatusPanel/McpStatusPanel";
import ProviderStatusPanel from "./components/compound/ProviderStatusPanel/ProviderStatusPanel";
import LoginView from "./views/LoginView/LoginView";
import ReviewTabsView from "./views/ReviewTabsView/ReviewTabsView";
import SettingsView from "./views/SettingsView/SettingsView";
import DocsView from "./views/DocsView/DocsView";
import type { View } from "./types";
import "./App.css";

// ── Static SVG icons (codicon-style, 16×16 viewBox) ──────────
const ICONS = {
  signIn: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3"/><path d="M6 8h7M11 5.5L13 8l-2 2.5"/></svg>',
  mail: '<svg viewBox="0 0 16 16"><path d="M1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4zm1.5.8v6.7l3.8-3.4L2.5 4.8zm.7-.8L8 7.9l4.8-3.9H3.2zM13.5 4.8l-3.8 3.3 3.8 3.4V4.8zM12.3 12L8.9 8.9 8 9.6l-.9-.7L3.7 12h8.6z"/></svg>',
  docs: '<svg viewBox="0 0 16 16"><path d="M2 2a1 1 0 0 1 1-1h6l4 4v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2zm7 0H3v12h9V5.5H9.5a.5.5 0 0 1-.5-.5V2zm1 0v3h3L10 2zM4 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z"/></svg>',
  settings: '<svg viewBox="0 0 16 16"><path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.3.7L2 7.4v1.2l2.4.5.3.7-1.3 2 .8.8 2-1.3.7.3.5 2.4h1.2l.5-2.4.7-.3 2 1.3.8-.8-1.3-2 .3-.7 2.4-.5V7.4l-2.4-.5-.3-.7 1.3-2-.8-.8-2 1.3-.7-.3zM8 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>',
  signOut: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/><path d="M10 8H3M5 5.5L3 8l2 2.5"/><line x1="10" y1="8" x2="15" y2="8"/><path d="M12 5.5L15 8l-3 2.5"/></svg>',
} as const;

export default function App() {
  const { postMessage, onMessage } = useVSCode();
  const { loggedIn, view, setView, pendingChallenge } = useAppAuth(postMessage, onMessage);
  const providers = useProviderRegistry(postMessage, onMessage);

  const [setupProviderId, setSetupProviderId] = useState<string | null>(null);

  const navigateToSetup = useCallback((providerId: string) => {
    setSetupProviderId(providerId);
    setView("docs");
  }, [setView]);

  const navItems = loggedIn
    ? [
        { id: "home", label: "Mail", icon: ICONS.mail },
        { id: "docs", label: "Docs", icon: ICONS.docs, align: "right" as const },
        { id: "settings", label: "Settings", icon: ICONS.settings, align: "right" as const },
      ]
    : [
        { id: "home", label: "Connect", icon: ICONS.signIn },
        { id: "docs", label: "Docs", icon: ICONS.docs, align: "right" as const },
        { id: "settings", label: "Settings", icon: ICONS.settings, align: "right" as const },
      ];

  const trailing = loggedIn ? (
    <button className="btn-signout" onClick={() => postMessage({ type: "logout" })}>
      <span className="btn-icon" dangerouslySetInnerHTML={{ __html: ICONS.signOut }} />
      <span>Sign Out</span>
    </button>
  ) : null;

  const isHome = view === "home";

  return (
    <div className="app">
      <NavBar items={navItems} activeId={view} onSelect={(id) => { setSetupProviderId(null); setView(id as View); }} trailing={trailing} />

      <div className="app__content">
        {!loggedIn && isHome && (
          <LoginView postMessage={postMessage} onMessage={onMessage} initialChallenge={pendingChallenge} providers={providers} onNavigateSetup={navigateToSetup} />
        )}
        {loggedIn && isHome && (
          <ReviewTabsView postMessage={postMessage} onMessage={onMessage} />
        )}
        {view === "settings" && <SettingsView postMessage={postMessage} onMessage={onMessage} />}
        {view === "docs" && <DocsView providers={providers} initialProviderId={setupProviderId} />}
      </div>

      <div className="app__panels">
        <ProviderStatusPanel postMessage={postMessage} onMessage={onMessage} />
        <McpStatusPanel postMessage={postMessage} onMessage={onMessage} />
      </div>
    </div>
  );
}
