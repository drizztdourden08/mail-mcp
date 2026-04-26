import { useState, useEffect, useCallback } from "react";

interface MailMessage {
  id: string;
  subject: string;
  from?: { emailAddress: { name: string; address: string } };
}

interface UnsubscribeInfo {
  messageId: string;
  subject: string;
  from: string;
  hasOneClick: boolean;
  httpUrl: string | null;
  mailtoUrl: string | null;
  listUnsubscribe: string | null;
}

interface Props {
  postMessage: (msg: unknown) => void;
  onMessage: (handler: (msg: Record<string, unknown>) => void) => () => void;
}

export default function UnsubscribeReview({ postMessage, onMessage }: Props) {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [unsubInfo, setUnsubInfo] = useState<Map<string, UnsubscribeInfo>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setSelected(new Set());
    setUnsubInfo(new Map());
    setActionResult(null);
    postMessage({ type: "get-messages", count: 50 });
  }, [postMessage]);

  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === "messages") {
        setMessages(msg.messages as MailMessage[]);
        setLoading(false);
        // Check each message for unsubscribe headers
        setChecking(true);
        for (const m of msg.messages as MailMessage[]) {
          postMessage({ type: "check-unsubscribe", id: m.id });
        }
      }
      if (msg.type === "unsubscribe-info") {
        const info = msg.info as UnsubscribeInfo;
        setUnsubInfo((prev) => {
          const next = new Map(prev);
          if (info.listUnsubscribe) {
            next.set(info.messageId, info);
          }
          return next;
        });
        setChecking(false);
      }
      if (msg.type === "action-result") {
        const results = msg.results as string[];
        setActionResult(results.join("\n"));
      }
      if (msg.type === "error") {
        setChecking(false);
        setActionResult(`Error: ${msg.error}`);
      }
    });
    refresh();
    return unsub;
  }, [onMessage, refresh]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = [...unsubInfo.keys()];
    if (selected.size === allIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const unsubscribeSelected = () => {
    if (selected.size === 0) return;
    postMessage({ type: "unsubscribe", ids: [...selected] });
  };

  const unsubList = [...unsubInfo.values()];

  return (
    <div className="unsub-view">
      <div className="toolbar">
        <button onClick={refresh} disabled={loading}>Refresh</button>
        <button onClick={selectAll} disabled={unsubList.length === 0}>
          {selected.size === unsubList.length ? "Deselect All" : "Select All"}
        </button>
        <button onClick={unsubscribeSelected} disabled={selected.size === 0} className="danger">
          Unsubscribe ({selected.size})
        </button>
      </div>

      {actionResult && (
        <div className="result-banner">
          {actionResult}
          <button onClick={() => setActionResult(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading messages...</p>
      ) : checking ? (
        <p className="loading">Checking for unsubscribe headers...</p>
      ) : unsubList.length === 0 ? (
        <p>No messages with unsubscribe support found.</p>
      ) : (
        <>
          <p className="hint">{unsubList.length} emails support unsubscribe</p>
          <ul className="message-list">
            {unsubList.map((info) => (
              <li key={info.messageId} className={`message ${selected.has(info.messageId) ? "selected" : ""}`}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selected.has(info.messageId)}
                    onChange={() => toggleSelect(info.messageId)}
                  />
                  <div className="message-content">
                    <div className="message-from">{info.from}</div>
                    <div className="message-subject">{info.subject}</div>
                    <div className="unsub-method">
                      {info.hasOneClick ? "✓ One-Click" : info.httpUrl ? "HTTP Link" : "Mailto"}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
