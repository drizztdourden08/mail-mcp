import { useEffect } from "react";
import Button from "../../components/primitive/Button/Button";
import Text from "../../components/primitive/Text/Text";
import Spinner from "../../components/primitive/Spinner/Spinner";
import Toolbar from "../../components/composite/Toolbar/Toolbar";
import ResultBanner from "../../components/composite/ResultBanner/ResultBanner";
import CheckboxList from "../../components/composite/CheckboxList/CheckboxList";
import { useSelection } from "../../components/composite/CheckboxList/behavior/useSelection";
import UnsubscribeItem from "../../components/compound/UnsubscribeItem/UnsubscribeItem";
import { useUnsubscribeCheck } from "./behavior/useUnsubscribeCheck";
import { useUnsubscribeActions } from "./behavior/useUnsubscribeActions";
import type { PostMessage, OnMessage } from "../../types";
import type { UnsubscribeInfo } from "../../components/compound/UnsubscribeItem/types";
import "./UnsubscribeView.css";

interface Props {
  postMessage: PostMessage;
  onMessage: OnMessage;
}

export default function UnsubscribeView({ postMessage, onMessage }: Props) {
  const { unsubList, loading, checking, refresh } = useUnsubscribeCheck(postMessage, onMessage);
  const { actionResult, setActionResult, clearResult, unsubscribe } = useUnsubscribeActions(postMessage, onMessage);
  const { selected, toggle, selectAll, clear } = useSelection();

  useEffect(() => {
    return onMessage((msg) => {
      if (msg.type === "action-result") {
        const results = msg.results as string[];
        setActionResult(results.join("\n"));
      }
    });
  }, [onMessage, setActionResult]);

  return (
    <div className="unsub-view">
      <Toolbar>
        <Button onClick={refresh} disabled={loading}>Refresh</Button>
        <Button variant="ghost" onClick={() => selectAll(unsubList.map((i) => i.messageId))} disabled={unsubList.length === 0}>
          {selected.size === unsubList.length ? "Deselect All" : "Select All"}
        </Button>
        <Button variant="danger" onClick={() => unsubscribe([...selected])} disabled={selected.size === 0}>
          Unsubscribe ({selected.size})
        </Button>
      </Toolbar>

      {actionResult && <ResultBanner message={actionResult} onDismiss={clearResult} />}

      {loading ? (
        <div className="unsub-view__loading"><Spinner /> <Text variant="waiting">Loading messages…</Text></div>
      ) : checking ? (
        <div className="unsub-view__loading"><Spinner size="sm" /> <Text variant="waiting">Checking for unsubscribe headers…</Text></div>
      ) : unsubList.length === 0 ? (
        <Text>No messages with unsubscribe support found.</Text>
      ) : (
        <>
          <Text variant="hint">{unsubList.length} emails support unsubscribe</Text>
          <CheckboxList
            items={unsubList.map((i) => ({ id: i.messageId, data: i }))}
            selected={selected}
            onToggle={toggle}
            renderItem={(item) => <UnsubscribeItem info={item.data as UnsubscribeInfo} />}
          />
        </>
      )}
    </div>
  );
}
