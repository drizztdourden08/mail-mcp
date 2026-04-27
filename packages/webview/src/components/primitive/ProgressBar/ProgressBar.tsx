import type { ProgressBarProps } from "./types";
import "./ProgressBar.css";

export default function ProgressBar({ progress, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={`progress-bar${className ? ` ${className}` : ""}`}>
      <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
