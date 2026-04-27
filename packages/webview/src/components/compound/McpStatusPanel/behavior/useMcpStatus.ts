import { useState, useEffect, useCallback } from "react";
import type { PostMessage, OnMessage } from "../../../../types";
import type { McpStatusData } from "../types";

const DEFAULT_DATA: McpStatusData = {
  status: "stopped",
  port: null,
  address: null,
  tools: 0,
  sessions: 0,
  uptime: 0,
  version: "",
  lastMessage: null,
};

export function useMcpStatus(postMessage: PostMessage, onMessage: OnMessage) {
  const [data, setData] = useState<McpStatusData>(DEFAULT_DATA);

  const poll = useCallback(() => {
    postMessage({ type: "get-mcp-status" });
  }, [postMessage]);

  useEffect(() => {
    poll();
    const iv = setInterval(poll, 5000);
    return () => clearInterval(iv);
  }, [poll]);

  useEffect(() => {
    return onMessage((msg) => {
      if (msg.type === "mcp-status") {
        setData(msg.data as McpStatusData);
      }
    });
  }, [onMessage]);

  return data;
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
