import overview from "./01-overview.md?raw";
import gettingStarted from "./02-getting-started.md?raw";
import capabilities from "./03-capabilities.md?raw";
import tools from "./04-tools.md?raw";
import workflows from "./05-workflows.md?raw";
import connectionTypes from "./06-connection-types.md?raw";

export interface DocSection {
  id: string;
  title: string;
  content: string;
}

export const docSections: DocSection[] = [
  { id: "overview", title: "Overview", content: overview },
  { id: "getting-started", title: "Getting Started", content: gettingStarted },
  { id: "capabilities", title: "Capabilities", content: capabilities },
  { id: "tools", title: "Tool Reference", content: tools },
  { id: "workflows", title: "Workflows & Examples", content: workflows },
  { id: "connection-types", title: "Connection Types", content: connectionTypes },
];
