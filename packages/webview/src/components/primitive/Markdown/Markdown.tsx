import { useMarkdownParser } from "./behavior/useMarkdownParser";
import type { MarkdownProps } from "./types";
import "./Markdown.css";

export default function Markdown({ content, className }: MarkdownProps) {
  const html = useMarkdownParser(content);
  return (
    <div
      className={`markdown${className ? ` ${className}` : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
