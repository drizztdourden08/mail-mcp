import CollapsiblePanel from "../../composite/CollapsiblePanel/CollapsiblePanel";
import DataRow from "../../composite/DataRow/DataRow";
import McpControls from "./sub/McpControls";
import { useMcpStatus, formatUptime } from "./behavior/useMcpStatus";
import { MCP_STATUS_LABELS } from "./types";
import type { StatusColor } from "../../primitive/StatusLight/types";
import type { PostMessage, OnMessage } from "../../../types";
import "./McpStatusPanel.css";

interface Props {
  postMessage: PostMessage;
  onMessage: OnMessage;
}

const STATUS_COLORS: Record<string, StatusColor> = {
  running: "green",
  stopped: "gray",
  starting: "yellow",
  error: "red",
};

export default function McpStatusPanel({ postMessage, onMessage }: Props) {
  const data = useMcpStatus(postMessage, onMessage);
  const statusColor = STATUS_COLORS[data.status] ?? "gray";
  const summary = data.status === "running"
    ? `${MCP_STATUS_LABELS[data.status]} · ${data.tools} tools`
    : MCP_STATUS_LABELS[data.status];

  return (
    <CollapsiblePanel
      title="MCP Server"
      statusColor={statusColor}
      statusGlow={data.status === "running"}
      summary={summary}
      className="mcp-status-panel"
    >
      <div className="mcp-status-panel__header">
        <McpControls data={data} postMessage={postMessage} />
      </div>

      <div className="mcp-status-panel__details">
        <DataRow label="Tools" value={`${data.tools} registered`} />
        {data.port && (
          <DataRow label="Endpoint" value={data.address ?? `127.0.0.1:${data.port}`} mono />
        )}
        {data.status === "running" && (
          <>
            <DataRow label="Sessions" value={String(data.sessions)} />
            <DataRow label="Uptime" value={formatUptime(data.uptime)} />
            <DataRow label="Version" value={data.version} />
          </>
        )}
        {data.lastMessage && (
          <DataRow label="Last" value={<span className="mcp-status-panel__last-msg">{data.lastMessage}</span>} />
        )}
      </div>
    </CollapsiblePanel>
  );
}
