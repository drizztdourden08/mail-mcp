import { useEffect } from "react";
import Button from "../../components/primitive/Button/Button";
import Text from "../../components/primitive/Text/Text";
import Spinner from "../../components/primitive/Spinner/Spinner";
import Toolbar from "../../components/composite/Toolbar/Toolbar";
import ResultBanner from "../../components/composite/ResultBanner/ResultBanner";
import CheckboxList from "../../components/composite/CheckboxList/CheckboxList";
import { useSelection } from "../../components/composite/CheckboxList/behavior/useSelection";
import MessageItem from "../../components/compound/MessageItem/MessageItem";
import { useInboxMessages } from "./behavior/useInboxMessages";
import { useInboxActions } from "./behavior/useInboxActions";
import type { PostMessage, OnMessage } from "../../types";
import type { MailMessageDisplay } from "../../components/compound/MessageItem/types";
import "./InboxReviewView.css";

interface Props {
  postMessage: PostMessage;
  onMessage: OnMessage;
}

export default function InboxReviewView({ postMessage, onMessage }: Props) {
  const { messages, loading, ipcReady, refresh } = useInboxMessages(postMessage, onMessage);
  const { selected, toggle, selectAll, clear } = useSelection();
  const { actionResult, clearResult, deleteMessages, moveMessages, handleMessages } =
    useInboxActions(postMessage, onMessage, () => { clear(); refresh(); });

  useEffect(() => {
    return onMessage(handleMessages);
  }, [onMessage, handleMessages]);

  return (
    <div className="inbox-view">
      <Toolbar>
        <Button onClick={refresh} disabled={loading}>Refresh</Button>
        <Button variant="ghost" onClick={() => selectAll(messages.map((m) => m.id))}>
          {selected.size === messages.length ? "Deselect All" : "Select All"}
        </Button>
        <Button variant="danger" onClick={() => deleteMessages([...selected])} disabled={selected.size === 0}>
          Delete ({selected.size})
        </Button>
        <Button onClick={() => moveMessages([...selected], "Archive")} disabled={selected.size === 0}>
          Archive ({selected.size})
        </Button>
        <Button onClick={() => moveMessages([...selected], "Junk")} disabled={selected.size === 0}>
          Junk ({selected.size})
        </Button>
      </Toolbar>

      {actionResult && <ResultBanner message={actionResult} onDismiss={clearResult} />}

      {loading ? (
        <div className="inbox-view__loading"><Spinner /> <Text variant="waiting">Loading…</Text></div>
      ) : ipcReady === false ? (
        <div className="inbox-view__no-ipc">
          <Text>MCP server is not running.</Text>
          <Text variant="hint">Start the MCP server, then click Refresh.</Text>
        </div>
      ) : messages.length === 0 ? (
        <Text>No messages found.</Text>
      ) : (
        <CheckboxList
          items={messages.map((m) => ({ id: m.id, data: m }))}
          selected={selected}
          onToggle={toggle}
          renderItem={(item) => <MessageItem message={item.data as MailMessageDisplay} />}
        />
      )}
    </div>
  );
}
