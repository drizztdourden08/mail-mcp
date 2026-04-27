import Button from "../Button/Button";
import type { CodeDisplayProps } from "./types";
import "./CodeDisplay.css";

export default function CodeDisplay({ code, onCopy, copied, className }: CodeDisplayProps) {
  return (
    <div className={`code-display${className ? ` ${className}` : ""}`}>
      <div className="code-display__row">
        <div className="code-display__code">{code}</div>
        {onCopy && (
          <Button
            variant="icon"
            title={copied ? "Copied!" : "Copy code"}
            onClick={onCopy}
            className="code-display__copy"
          >
            {copied ? "✓" : "⎘"}
          </Button>
        )}
      </div>
    </div>
  );
}
