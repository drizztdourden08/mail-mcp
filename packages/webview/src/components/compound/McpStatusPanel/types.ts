export interface McpStatusData {
  status: "running" | "stopped" | "starting" | "error";
  port: number | null;
  address: string | null;
  tools: number;
  sessions: number;
  uptime: number;
  version: string;
  lastMessage: string | null;
}

export const MCP_STATUS_LABELS: Record<McpStatusData["status"], string> = {
  running: "Running",
  stopped: "Stopped",
  starting: "Starting…",
  error: "Error",
};
