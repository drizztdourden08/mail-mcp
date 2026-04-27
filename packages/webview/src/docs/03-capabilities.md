# Capabilities

## What Can Mail MCP Do?

Mail MCP exposes a set of tools to AI assistants. The AI's default instructions require it to use the review workflow for destructive actions, but **you should always monitor what the AI is doing** (see the disclaimer in Overview).

### Email Operations
- **List & Search** — browse folders, full-text search, date filtering
- **Read** — full message body, headers, attachments metadata
- **Move** — batch move up to 50 emails between folders
- **Delete** — batch delete up to 50 emails

### Folder Management
- **List** — flat list of top-level folders with message counts
- **Tree** — full recursive folder hierarchy

### Unsubscribe
- **Check** — detect unsubscribe mechanisms for up to 20 emails
- **Execute** — batch unsubscribe from mailing lists

### Email Cache (High-Performance)
For large-scale analysis (hundreds/thousands of emails):
- **Sync** — download messages with bodies and headers into memory
- **Search** — regex / field search with zero API calls
- **Filter** — by date range, read status, unsubscribe availability
- **Get** — retrieve a cached message by ID
- **Clear** — free memory when done

### Review System (Human-in-the-Loop)
The review system is the primary safety mechanism:
1. AI builds a review table with proposed actions
2. You see the review in the VS Code panel
3. You approve or reject individual items
4. AI only acts on items you approved

> **Remember:** The review system relies on the AI choosing to use it. It is not enforced at the server level. See the Overview disclaimer for details.
