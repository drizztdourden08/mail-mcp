import Button from "../../../primitive/Button/Button";
import type { PostMessage } from "../../../../types";
import type { McpStatusData } from "../types";

interface Props {
  data: McpStatusData;
  postMessage: PostMessage;
}

export default function McpControls({ data, postMessage }: Props) {
  return (
    <div className="mcp-controls">
      <Button
        variant="icon"
        title="Start"
        onClick={() => postMessage({ type: "mcp-start" })}
        disabled={data.status === "running" || data.status === "starting"}
      >▶</Button>
      <Button
        variant="icon"
        title="Stop"
        onClick={() => postMessage({ type: "mcp-stop" })}
        disabled={data.status === "stopped"}
      >■</Button>
      <Button
        variant="icon"
        title="Restart"
        onClick={() => postMessage({ type: "mcp-restart" })}
        disabled={data.status === "stopped"}
      >⟳</Button>
    </div>
  );
}
