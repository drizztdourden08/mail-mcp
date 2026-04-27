export interface CollapsiblePanelProps {
  title: string;
  /** Summary shown inline when collapsed (e.g., "24 tools") */
  summary?: string;
  statusColor?: import("../../primitive/StatusLight/types").StatusColor;
  statusGlow?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}
