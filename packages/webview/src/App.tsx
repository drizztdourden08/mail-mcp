import { useState, useEffect } from "react";
import { useVSCode } from "./hooks/useVSCode";
import Login from "./views/Login";
import InboxReview from "./views/InboxReview";
import UnsubscribeReview from "./views/UnsubscribeReview";

type View = "login" | "inbox-review" | "unsubscribe-review";

export default function App() {
  const { postMessage, onMessage } = useVSCode();
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>("login");

  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === "auth-status") {
        setLoggedIn(msg.loggedIn as boolean);
        if (msg.loggedIn) setView("inbox-review");
      }
      if (msg.type === "navigate") {
        setView(msg.view as View);
      }
    });
    postMessage({ type: "ready" });
    return unsub;
  }, [onMessage, postMessage]);

  if (!loggedIn) {
    return <Login postMessage={postMessage} onMessage={onMessage} />;
  }

  return (
    <div className="app">
      <nav className="nav">
        <button className={view === "inbox-review" ? "active" : ""} onClick={() => setView("inbox-review")}>
          Inbox
        </button>
        <button className={view === "unsubscribe-review" ? "active" : ""} onClick={() => setView("unsubscribe-review")}>
          Unsubscribe
        </button>
        <button className="logout" onClick={() => postMessage({ type: "logout" })}>
          Sign Out
        </button>
      </nav>
      {view === "inbox-review" && <InboxReview postMessage={postMessage} onMessage={onMessage} />}
      {view === "unsubscribe-review" && <UnsubscribeReview postMessage={postMessage} onMessage={onMessage} />}
    </div>
  );
}
