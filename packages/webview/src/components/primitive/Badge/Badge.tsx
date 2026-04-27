import type { BadgeProps } from "./types";
import "./Badge.css";

export default function Badge({ count, className }: BadgeProps) {
  return <span className={`badge${className ? ` ${className}` : ""}`}>{count}</span>;
}
