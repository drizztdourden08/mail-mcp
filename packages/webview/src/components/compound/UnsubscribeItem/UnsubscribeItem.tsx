import UnsubscribeMethod from "./sub/UnsubscribeMethod";
import type { UnsubscribeInfo } from "./types";
import "./UnsubscribeItem.css";

interface Props {
  info: UnsubscribeInfo;
}

export default function UnsubscribeItem({ info }: Props) {
  return (
    <div className="unsub-item__content">
      <div className="unsub-item__from">{info.from}</div>
      <div className="unsub-item__subject">{info.subject}</div>
      <UnsubscribeMethod hasOneClick={info.hasOneClick} httpUrl={info.httpUrl} />
    </div>
  );
}
