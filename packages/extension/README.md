<p align="center">
  <img src="https://raw.githubusercontent.com/drizztdourden08/mail-mcp/master/assets/logo-512.png" alt="Mail MCP" width="150" />
</p>

# Mail MCP

**Give AI assistants secure, human-in-the-loop access to your email.**

Mail MCP is an MCP (Model Context Protocol) server + VS Code extension that lets AI assistants like Copilot and Claude read, search, organize, and clean up your email — with you approving every destructive action.

## Features

- **24 MCP Tools** — List, search, read, move, delete, unsubscribe, cache, and review emails
- **Human-in-the-Loop Review** — AI proposes actions, you approve or reject in a visual checklist before anything happens
- **High-Performance Cache** — Sync 500+ emails to memory for instant regex search & filtering without API calls
- **Secure Device Code Auth** — OAuth 2.0 sign-in with auto-copy code and auto-open browser
- **Provider-Agnostic** — Plugin architecture supporting Microsoft Exchange today, more providers coming
- **Built-in Documentation** — Overview, setup guides, tool reference, and workflow examples right in the panel
- **Custom Instructions** — Override or extend the AI's default behavior from extension settings

## How It Works

```
AI Agent (Copilot / Claude) ←─ MCP ─→ Mail MCP Server ←─ IPC ─→ VS Code Extension ←─→ Review UI
```

1. Your AI assistant connects to the MCP server
2. It can read, search, and analyze your email
3. When it wants to modify anything (delete, move, unsubscribe), it creates a **review**
4. You see the review in the Mail MCP panel with checkboxes
5. You approve or reject — the AI only acts on what you approved

## Screenshots

### Sign-In Flow
![Device code sign-in initiated from Copilot chat](https://raw.githubusercontent.com/drizztdourden08/mail-mcp/master/screenshots/sign-in.png)
Ask the AI to log you in — it triggers a device code flow. The code is auto-copied and the browser opens automatically.

### Review Building
![AI building a review list](https://raw.githubusercontent.com/drizztdourden08/mail-mcp/master/screenshots/review-building.png)
The AI searches for emails, creates a review, and adds items. You see them appear in real-time.

### Review Approval
![Approval panel with checkboxes](https://raw.githubusercontent.com/drizztdourden08/mail-mcp/master/screenshots/review-approval.png)
All items are pre-selected. Filter, deselect what you want to keep, then approve or reject.

### Chat: Full Workflow
![Copilot chat showing the full review workflow](https://raw.githubusercontent.com/drizztdourden08/mail-mcp/master/screenshots/chat-workflow.png)
The AI waits for your approval, executes on approved items, and closes the review.

### Chat: Deletion Result
![Deletion result in chat](https://raw.githubusercontent.com/drizztdourden08/mail-mcp/master/screenshots/chat-delete.png)
Confirmed deletion with full tool input/output transparency.

### Documentation
![Built-in documentation and provider setup](https://raw.githubusercontent.com/drizztdourden08/mail-mcp/master/screenshots/docs.png)
Overview, getting started, capabilities, tool reference, workflows, and provider setup — all in the Docs tab.

### Settings
![Settings panel](https://raw.githubusercontent.com/drizztdourden08/mail-mcp/master/screenshots/settings.png)
Configure auto-copy, auto-open browser, review focus, MCP config, and custom AI instructions.

## Getting Started

### 1. Azure AD App Registration

You need an app registration for your Microsoft Exchange account:

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Create a new registration
3. Add API permissions: `User.Read`, `Mail.Read`, `Mail.ReadWrite`
4. Enable Device Code Flow: Authentication → Allow public client flows → **Yes**
5. Copy the **Application (client) ID**

### 2. Configure the Client ID

Set your client ID using one of these methods:

- **VS Code Settings**: Settings → Extensions → Mail MCP → **Client ID**
- **Environment variable**: `MAIL_MCP_CLIENT_ID=your-client-id`
- **`.env` file** in the workspace root

### 3. Connect

1. Open the Mail MCP panel (envelope icon in the activity bar)
2. Click **Connect**
3. A device code appears — it's auto-copied to your clipboard
4. Sign in at the URL that auto-opens in your browser
5. Done! The MCP server starts and your AI can access your email

## Example Workflows

| Ask your AI... | What happens |
|----------------|-------------|
| *"Clean up my inbox"* | Syncs emails → categorizes → presents review → you approve deletions |
| *"Find all newsletters and unsubscribe"* | Scans for unsubscribe headers → presents list → you pick which to unsub |
| *"Move bank emails to Finance"* | Searches by sender → presents matches → you approve the move |
| *"Delete all Microsoft sign-in notifications"* | Searches → presents review → you select & approve → deleted |

## Extension Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `mail-mcp.clientId` | Azure AD Application (client) ID | — |
| `mail-mcp.autoCopyCode` | Auto-copy device code to clipboard | `true` |
| `mail-mcp.autoOpenBrowser` | Auto-open browser for sign-in | `true` |
| `mail-mcp.focusOnReview` | Focus the panel when AI creates a review | `true` |
| `mail-mcp.customInstructions` | Custom instructions sent to the AI | — |

## Requirements

- **VS Code** 1.96+
- **Node.js** 18+
- A Microsoft Exchange / Outlook account with an Azure AD app registration

## Security

> **You are responsible for controlling your AI assistant.**
>
> The review system instructs the AI to present actions for approval before executing them. However, there is no technical enforcement preventing the AI from calling tools directly. Monitor what the AI is doing and revoke access if it misbehaves.

## Links

- [GitHub Repository](https://github.com/drizztdourden08/mail-mcp)
- [Issue Tracker](https://github.com/drizztdourden08/mail-mcp/issues)
- [Changelog](https://github.com/drizztdourden08/mail-mcp/blob/master/CHANGELOG.md)

## License

[MIT](https://github.com/drizztdourden08/mail-mcp/blob/master/LICENSE) © [Drizztdourden_](https://github.com/drizztdourden08)
