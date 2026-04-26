import { useState, useEffect, useCallback } from "react";

interface MailMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  isRead: boolean;
  from?: { emailAddress: { name: string; address: string } };
}

interface Props {
  postMessage: (msg: unknown) => void;
  onMessage: (handler: (msg: Record<string, unknown>) => void) => () => void;
}

export default function InboxReview({ postMessage, onMessage }: Props) {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setSelected(new Set());
    setActionResult(null);
    postMessage({ type: "get-messages", count: 30 });
  }, [postMessage]);

  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === "messages") {
        setMessages(msg.messages as MailMessage[]);
        setLoading(false);
      }
      if (msg.type === "action-result") {
        const results = msg.results as string[];
        setActionResult(results.join("\n"));
        refresh();
      }
      if (msg.type === "error") {
        setLoading(false);
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
    if (selected.size === messages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(messages.map((m) => m.id)));
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    postMessage({ type: "delete-messages", ids: [...selected] });
    setLoading(true);
  };

  const moveSelected = (folder: string) => {
    if (selected.size === 0) return;
    postMessage({ type: "move-messages", ids: [...selected], folder });
    setLoading(true);
  };

  return (
    <div className="inbox-view">
      <div className="toolbar">
        <button onClick={refresh} disabled={loading}>Refresh</button>
        <button onClick={selectAll}>
          {selected.size === messages.length ? "Deselect All" : "Select All"}
        </button>
        <button onClick={deleteSelected} disabled={selected.size === 0} className="danger">
          Delete ({selected.size})
        </button>
        <button onClick={() => moveSelected("Archive")} disabled={selected.size === 0}>
          Archive ({selected.size})
        </button>
        <button onClick={() => moveSelected("Junk")} disabled={selected.size === 0}>
          Junk ({selected.size})
        </button>
      </div>

      {actionResult && (
        <div className="result-banner">
          {actionResult}
          <button onClick={() => setActionResult(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading...</p>
      ) : messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul className="message-list">
          {messages.map((m) => (
            <li key={m.id} className={`message ${selected.has(m.id) ? "selected" : ""} ${m.isRead ? "" : "unread"}`}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggleSelect(m.id)}
                />
                <div className="message-content">
                  <div className="message-from">
                    {m.from?.emailAddress?.name ?? m.from?.emailAddress?.address ?? "Unknown"}
                  </div>
                  <div className="message-subject">{m.subject}</div>
                  <div className="message-preview">{m.bodyPreview?.slice(0, 80)}</div>
                  <div className="message-date">
                    {new Date(m.receivedDateTime).toLocaleString()}
                  </div>
                </div>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
