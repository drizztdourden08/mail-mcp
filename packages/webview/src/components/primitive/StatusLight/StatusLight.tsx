import { STATUS_CSS_COLORS, type StatusLightProps } from "./types";
import "./StatusLight.css";

export default function StatusLight({ color, glow = false, className }: StatusLightProps) {
  const cssColor = STATUS_CSS_COLORS[color];
  return (
    <span
      className={`status-light${className ? ` ${className}` : ""}`}
      style={{
        background: cssColor,
        boxShadow: glow ? `0 0 6px ${cssColor}` : "none",
      }}
    />
  );
}
