const fs = require("fs");

// ── Inline formatting ────────────────────────────────────────
function inlineFormat(text) {
  let out = text;
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return out;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let parseListCalls = 0;

function parseList(lines, start, baseIndent) {
  parseListCalls++;
  if (parseListCalls > 100) {
    console.log("INFINITE RECURSION DETECTED at line", start, "baseIndent", baseIndent);
    console.log("Line content:", JSON.stringify(lines[start]));
    process.exit(1);
  }

  const items = [];
  let i = start;
  let ordered = null;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (trimmed === "") break;

    const isUl = /^[-*+] /.test(trimmed);
    const isOl = /^\d+\. /.test(trimmed);
    if (!isUl && !isOl && indent <= baseIndent) break;

    // Sub-list (deeper indent) — recurse
    if (indent > baseIndent) {
      console.log(`  [depth ${parseListCalls}] Sub-list at line ${i}: indent=${indent} > base=${baseIndent}, content="${trimmed.slice(0, 60)}"`);
      const sub = parseList(lines, i, indent);
      if (sub.consumed > 0) {
        if (items.length > 0) {
          items[items.length - 1] += sub.html;
        }
        i += sub.consumed;
      } else {
        if (items.length > 0) {
          items[items.length - 1] += " " + inlineFormat(esc(trimmed));
        }
        i++;
      }
      continue;
    }

    if (indent < baseIndent) break;

    if (ordered === null) ordered = isOl;

    let content;
    if (isUl) {
      content = trimmed.replace(/^[-*+] /, "");
    } else if (isOl) {
      content = trimmed.replace(/^\d+\. /, "");
    } else {
      if (items.length > 0) {
        items[items.length - 1] += " " + inlineFormat(esc(trimmed));
      }
      i++;
      continue;
    }

    items.push(`<li>${inlineFormat(esc(content))}`);
    i++;
  }

  const closedItems = items.map((item) => item.includes("</li>") ? item : item + "</li>");
  const tag = ordered ? "ol" : "ul";
  return {
    html: `<${tag}>${closedItems.join("")}</${tag}>`,
    consumed: i - start,
  };
}

function parseTable(lines, start) {
  const rows = [];
  let i = start;
  let hasHeader = false;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith("|") && !line.endsWith("|")) break;
    if (/^\|[\s\-:|]+\|$/.test(line)) {
      hasHeader = rows.length > 0;
      i++;
      continue;
    }
    const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
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
    cells.forEach((cell) => { html += `<${tag}>${inlineFormat(esc(cell))}</${tag}>`; });
    html += "</tr>";
    if (rowTag === "thead") html += "</thead>";
  });
  if (hasHeader && rows.length > 1) html += "</tbody>";
  html += "</table></div>";
  return { html, consumed: i - start };
}

function parseMarkdown(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") { i++; continue; }

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(esc(lines[i]));
        i++;
      }
      i++;
      const langAttr = lang ? ` data-lang="${esc(lang)}"` : "";
      blocks.push(`<pre${langAttr}><code>${codeLines.join("\n")}</code></pre>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { blocks.push("<hr>"); i++; continue; }

    const headerMatch = trimmed.match(/^(#{1,6}) (.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      blocks.push(`<h${level}>${inlineFormat(esc(headerMatch[2]))}</h${level}>`);
      i++;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const table = parseTable(lines, i);
      if (table.consumed > 0) { blocks.push(table.html); i += table.consumed; continue; }
    }

    const isUl = /^[-*+] /.test(trimmed);
    const isOl = /^\d+\. /.test(trimmed);
    if (isUl || isOl) {
      console.log(`\n[TOP] List at line ${i}: "${trimmed.slice(0, 60)}", indent=${line.length - trimmed.length}`);
      parseListCalls = 0;
      const list = parseList(lines, i, line.length - trimmed.length);
      console.log(`[TOP] List consumed ${list.consumed} lines`);
      blocks.push(list.html);
      i += list.consumed;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(`<blockquote>${inlineFormat(esc(quoteLines.join(" ")))}</blockquote>`);
      continue;
    }

    const paraLines = [];
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

// ── Run test ─────────────────────────────────────────────────
const md = fs.readFileSync("packages/mcp-server/src/providers/exchange/setup.md", "utf-8");
console.log("Input length:", md.length, "chars");
console.log("Lines:", md.split("\n").length);
console.log("");

const t0 = Date.now();
const result = parseMarkdown(md);
const elapsed = Date.now() - t0;
console.log("\nParse time:", elapsed + "ms");
console.log("Output length:", result.length, "chars");
if (elapsed > 100) {
  console.log("!!! PARSER IS SLOW !!!");
}
