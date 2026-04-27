import { useMemo } from "react";

/** Improved markdown → HTML converter with nested list and table support. */
export function useMarkdownParser(source: string): string {
  return useMemo(() => {
    const t0 = performance.now();
    const result = parseMarkdown(source);
    const elapsed = performance.now() - t0;
    console.log(`[dbg] [${t0.toFixed(1)}ms] parseMarkdown: ${elapsed.toFixed(2)}ms, input=${source.length}chars, output=${result.length}chars`);
    // Forward to extension for file logging
    try {
      (window as any).__vscodeApi?.postMessage({ type: "debug-log", args: [`parseMarkdown: ${elapsed.toFixed(2)}ms, input=${source.length}chars`] });
    } catch {}
    return result;
  }, [source]);
}

// ── Token types ──────────────────────────────────────────────
interface Token {
  type: string;
  raw: string;
  html?: string;
  children?: Token[];
}

// ── Inline formatting ────────────────────────────────────────
function inlineFormat(text: string): string {
  let out = text;
  // Inline code (must come first to protect contents)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold + italic
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  // Bold
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return out;
}

// ── Escape HTML entities ─────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── List parser (recursive, handles nesting) ─────────────────
function parseList(lines: string[], start: number, baseIndent: number): { html: string; consumed: number } {
  const items: string[] = [];
  let i = start;
  let ordered: boolean | null = null;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    // Blank line ends this list level
    if (trimmed === "") break;

    // Not a list item and not a continuation/sub-item — end
    const isUl = /^[-*+] /.test(trimmed);
    const isOl = /^\d+\. /.test(trimmed);
    if (!isUl && !isOl && indent <= baseIndent) break;

    // Sub-list (deeper indent) — recurse
    if (indent > baseIndent) {
      const sub = parseList(lines, i, indent);
      if (sub.consumed > 0) {
        // Append sub-list HTML to the last item
        if (items.length > 0) {
          items[items.length - 1] += sub.html;
        }
        i += sub.consumed;
      } else {
        // Not a sub-list — treat as continuation of the previous item
        if (items.length > 0) {
          items[items.length - 1] += " " + inlineFormat(esc(trimmed));
        }
        i++;
      }
      continue;
    }

    // Same level item
    if (indent < baseIndent) break;

    if (ordered === null) ordered = isOl;

    let content: string;
    if (isUl) {
      content = trimmed.replace(/^[-*+] /, "");
    } else if (isOl) {
      content = trimmed.replace(/^\d+\. /, "");
    } else {
      // Continuation line — append to last item
      if (items.length > 0) {
        items[items.length - 1] += " " + inlineFormat(esc(trimmed));
      }
      i++;
      continue;
    }

    items.push(`<li>${inlineFormat(esc(content))}`);
    i++;
  }

  // Close all li tags
  const closedItems = items.map((item) => item.includes("</li>") ? item : item + "</li>");
  const tag = ordered ? "ol" : "ul";
  return {
    html: `<${tag}>${closedItems.join("")}</${tag}>`,
    consumed: i - start,
  };
}

// ── Table parser ─────────────────────────────────────────────
function parseTable(lines: string[], start: number): { html: string; consumed: number } {
  const rows: string[][] = [];
  let i = start;
  let hasHeader = false;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith("|") && !line.endsWith("|")) break;

    // Separator row (|---|---|)
    if (/^\|[\s\-:|]+\|$/.test(line)) {
      hasHeader = rows.length > 0;
      i++;
      continue;
    }

    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    rows.push(cells);
    i++;
  }

  if (rows.length === 0) return { html: "", consumed: 0 };

  let html = '<div class="markdown__table-wrap"><table>';

  rows.forEach((cells, idx) => {
    const tag = hasHeader && idx === 0 ? "th" : "td";
    const rowTag = hasHeader && idx === 0 ? "thead" : (idx === 1 && hasHeader ? "tbody" : "");
    if (rowTag === "thead") html += "<thead>";
    if (rowTag === "tbody") html += "<tbody>";
    html += "<tr>";
    cells.forEach((cell) => {
      html += `<${tag}>${inlineFormat(esc(cell))}</${tag}>`;
    });
    html += "</tr>";
    if (rowTag === "thead") html += "</thead>";
  });

  if (hasHeader && rows.length > 1) html += "</tbody>";
  html += "</table></div>";

  return { html, consumed: i - start };
}

// ── Main parser ──────────────────────────────────────────────
function parseMarkdown(md: string): string {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (trimmed === "") {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(esc(lines[i]));
        i++;
      }
      i++; // skip closing ```
      const langAttr = lang ? ` data-lang="${esc(lang)}"` : "";
      blocks.push(`<pre${langAttr}><code>${codeLines.join("\n")}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push("<hr>");
      i++;
      continue;
    }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,6}) (.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      blocks.push(`<h${level}>${inlineFormat(esc(headerMatch[2]))}</h${level}>`);
      i++;
      continue;
    }

    // Table
    if (trimmed.startsWith("|")) {
      const table = parseTable(lines, i);
      if (table.consumed > 0) {
        blocks.push(table.html);
        i += table.consumed;
        continue;
      }
    }

    // Lists (unordered or ordered)
    const isUl = /^[-*+] /.test(trimmed);
    const isOl = /^\d+\. /.test(trimmed);
    if (isUl || isOl) {
      const indent = line.length - trimmed.length;
      const list = parseList(lines, i, indent);
      if (list.consumed > 0) {
        blocks.push(list.html);
        i += list.consumed;
      } else {
        // Safety: treat as paragraph to avoid infinite loop
        blocks.push(`<p>${inlineFormat(esc(trimmed))}</p>`);
        i++;
      }
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const ql = lines[i].trim();
        if (ql.startsWith("> ")) {
          quoteLines.push(ql.slice(2));
          i++;
        } else if (ql === ">") {
          // Empty continuation line → paragraph break inside blockquote
          quoteLines.push("");
          i++;
        } else {
          break;
        }
      }
      // Parse inner content as markdown (recursive for nested formatting)
      const innerHtml = parseMarkdown(quoteLines.join("\n"));
      blocks.push(`<blockquote>${innerHtml}</blockquote>`);
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("|") &&
      !/^[-*+] /.test(lines[i].trim()) &&
      !/^\d+\. /.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("> ") &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(`<p>${inlineFormat(esc(paraLines.join(" ")))}</p>`);
    }
  }

  return blocks.join("");
}
