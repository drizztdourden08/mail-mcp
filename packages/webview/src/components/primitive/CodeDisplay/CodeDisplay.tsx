import type { CodeDisplayProps } from "./types";
import "./CodeDisplay.css";

const COPY_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 4h1V2a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h1zm1 1H3v8h7v-1H6a1 1 0 0 1-1-1V5zm1-2v8h7V2H6z"/></svg>';
const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>';

export default function CodeDisplay({ code, onCopy, copied, className }: CodeDisplayProps) {
  return (
    <div className={`code-display${className ? ` ${className}` : ""}`}>
      <div className="code-display__code">{code}</div>
      {onCopy && (
        <button
          className={`code-display__fab${copied ? " code-display__fab--copied" : ""}`}
          title={copied ? "Copied!" : "Copy code"}
          onClick={onCopy}
        >
          <span dangerouslySetInnerHTML={{ __html: copied ? CHECK_ICON : COPY_ICON }} />
        </button>
      )}
    </div>
  );
}
