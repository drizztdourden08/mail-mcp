import type { ToolbarProps } from "./types";
import "./Toolbar.css";

export default function Toolbar({ children, className }: ToolbarProps) {
  return <div className={`toolbar${className ? ` ${className}` : ""}`}>{children}</div>;
}
