import type { DataRowProps } from "./types";
import "./DataRow.css";

export default function DataRow({ label, value, mono, className }: DataRowProps) {
  return (
    <div className={`data-row${className ? ` ${className}` : ""}`}>
      <span className="data-row__label">{label}</span>
      <span className={`data-row__value${mono ? " data-row__value--mono" : ""}`}>{value}</span>
    </div>
  );
}
