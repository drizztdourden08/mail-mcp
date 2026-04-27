import StatusLight from "../../primitive/StatusLight/StatusLight";
import type { CollapsiblePanelProps } from "./types";
import { useCollapse } from "./behavior/useCollapse";
import "./CollapsiblePanel.css";

export default function CollapsiblePanel({
  title,
  summary,
  statusColor,
  statusGlow,
  defaultExpanded = false,
  children,
  className,
}: CollapsiblePanelProps) {
  const { expanded, toggle } = useCollapse(defaultExpanded);

  return (
    <div className={`collapsible${className ? ` ${className}` : ""}`}>
      <button className="collapsible__header" onClick={toggle} type="button">
        <span className="collapsible__chevron">{expanded ? "▾" : "▸"}</span>
        {statusColor && <StatusLight color={statusColor} glow={statusGlow} />}
        <span className="collapsible__title">{title}</span>
        {!expanded && summary && <span className="collapsible__summary">{summary}</span>}
      </button>
      {expanded && <div className="collapsible__body">{children}</div>}
    </div>
  );
}
