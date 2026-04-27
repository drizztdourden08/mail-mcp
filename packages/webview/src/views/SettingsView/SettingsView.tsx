import { useState, useEffect, useCallback, useRef } from "react";
import Title from "../../components/primitive/Title/Title";
import Text from "../../components/primitive/Text/Text";
import Button from "../../components/primitive/Button/Button";
import Markdown from "../../components/primitive/Markdown/Markdown";
import SettingToggle from "../../components/composite/SettingToggle/SettingToggle";
import { useSettings } from "./behavior/useSettings";
import type { PostMessage, OnMessage } from "../../types";
import "./SettingsView.css";

interface Props {
  postMessage: PostMessage;
  onMessage: OnMessage;
}

type SettingsTab = "general" | "mcp-config" | "instructions" | "custom-instructions";

export default function SettingsView({ postMessage, onMessage }: Props) {
  const { settings, update } = useSettings(postMessage, onMessage);
  const [tab, setTab] = useState<SettingsTab>("general");
  const [defaultInstructions, setDefaultInstructions] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [savedMsg, setSavedMsg] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocalEdit = useRef(false);

  // Fetch instructions from MCP server
  useEffect(() => {
    postMessage({ type: "get-instructions" });
    postMessage({ type: "get-custom-instructions" });
    return onMessage((msg) => {
      if (msg.type === "instructions") {
        setDefaultInstructions(msg.content as string);
      }
      if (msg.type === "custom-instructions") {
        // Only update if not a local edit (avoid clobbering mid-typing)
        if (!isLocalEdit.current) {
          setCustomInstructions(msg.content as string);
        }
      }
    });
  }, [onMessage, postMessage]);

  const saveCustomInstructions = useCallback((content: string) => {
    postMessage({ type: "set-custom-instructions", content });
    setSavedMsg("Saved");
    setTimeout(() => setSavedMsg(""), 1500);
    // Allow external updates again after save
    setTimeout(() => { isLocalEdit.current = false; }, 200);
  }, [postMessage]);

  const onCustomChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    isLocalEdit.current = true;
    setCustomInstructions(val);
    // Debounce auto-save (800ms)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveCustomInstructions(val), 800);
  }, [saveCustomInstructions]);

  const addMcpConfig = useCallback((client: string) => {
    postMessage({ type: "add-mcp-config", client });
  }, [postMessage]);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "mcp-config", label: "MCP Config" },
    { id: "instructions", label: "Instructions" },
    { id: "custom-instructions", label: "Custom" },
  ];

  return (
    <div className="settings-view">
      <div className="settings-view__tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`settings-view__tab${tab === t.id ? " settings-view__tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="settings-view__section">
          <Title level={3}>Sign-in via Copilot Chat</Title>

          <SettingToggle
            checked={settings.autoCopyCode}
            onChange={(v) => update("autoCopyCode", v)}
            label="Auto-copy code to clipboard"
            description="The device code is automatically copied so you can paste it in the browser."
          />

          <SettingToggle
            checked={settings.autoOpenBrowser}
            onChange={(v) => update("autoOpenBrowser", v)}
            label="Auto-open browser"
            description="The sign-in page opens automatically when a login is initiated."
          />

          <Title level={3}>Reviews</Title>

          <SettingToggle
            checked={settings.focusOnReview}
            onChange={(v) => update("focusOnReview", v)}
            label="Focus panel on new review"
            description="Automatically focus the Mail MCP panel when the AI creates a new review."
          />
        </div>
      )}

      {tab === "mcp-config" && (
        <div className="settings-view__section">
          <Title level={3}>Add MCP Configuration</Title>
          <Text variant="description">
            Click a button below to automatically add Mail MCP to your AI client's configuration.
          </Text>
          <div className="settings-view__config-buttons">
            <Button onClick={() => addMcpConfig("vscode")}>Add to VS Code (Copilot)</Button>
            <Button onClick={() => addMcpConfig("claude")}>Add to Claude Desktop</Button>
            <Button onClick={() => addMcpConfig("cursor")}>Add to Cursor</Button>
          </div>
          <Text variant="hint">
            This writes the MCP server entry to the appropriate config file for each client.
          </Text>
        </div>
      )}

      {tab === "instructions" && (
        <div className="settings-view__section">
          <Title level={3}>Default MCP Instructions</Title>
          <Text variant="description">
            These are the instructions sent to the AI when it connects via MCP. Read-only.
          </Text>
          <div className="settings-view__instructions-box">
            <Markdown content={defaultInstructions || "_Loading..._"} />
          </div>
        </div>
      )}

      {tab === "custom-instructions" && (
        <div className="settings-view__section">
          <Title level={3}>Custom Instructions</Title>
          <Text variant="description">
            Write your own instructions for the AI. These take priority over default instructions if contradictory. Auto-saves after you stop typing.
          </Text>
          <textarea
            className="settings-view__textarea"
            value={customInstructions}
            onChange={onCustomChange}
            placeholder="e.g. Never delete emails from my boss. Always archive newsletters instead of deleting them."
            rows={12}
          />
          {savedMsg && <Text variant="hint" className="settings-view__saved-hint">{savedMsg}</Text>}
        </div>
      )}
    </div>
  );
}
