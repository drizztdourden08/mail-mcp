import "./UnsubscribeMethod.css";

interface Props {
  hasOneClick: boolean;
  httpUrl: string | null;
}

export default function UnsubscribeMethod({ hasOneClick, httpUrl }: Props) {
  const label = hasOneClick ? "✓ One-Click" : httpUrl ? "HTTP Link" : "Mailto";
  return <div className="unsub-method">{label}</div>;
}
