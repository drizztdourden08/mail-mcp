import Button from "../../primitive/Button/Button";
import type { ResultBannerProps } from "./types";
import "./ResultBanner.css";

export default function ResultBanner({ message, onDismiss, className }: ResultBannerProps) {
  return (
    <div className={`result-banner${className ? ` ${className}` : ""}`}>
      <span className="result-banner__text">{message}</span>
      <Button variant="ghost" onClick={onDismiss} className="result-banner__close">✕</Button>
    </div>
  );
}
