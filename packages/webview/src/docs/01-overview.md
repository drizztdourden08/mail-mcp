# Mail MCP

Mail MCP is a Model Context Protocol (MCP) server and VS Code extension that gives AI assistants secure access to your email — with you in the loop.

## Why Mail MCP?

AI assistants are great at analyzing, sorting, and drafting — but they shouldn't touch your inbox without permission. Mail MCP bridges that gap:

- **AI reads your mail** — search, filter, categorize thousands of messages in seconds.
- **Review before action** — destructive actions (delete, move, unsubscribe) go through a review UI where you approve or reject.
- **Works with any MCP client** — Claude Desktop, VS Code Copilot, or any agent that speaks MCP.
- **Provider-agnostic** — connect any email provider that has a Mail MCP plugin.

## Architecture

```
┌─────────────────┐         ┌──────────────┐
│  MCP Client     │◄─stdio─►│  MCP Server  │
│  (AI Agent)     │         │  (Node.js)   │
└─────────────────┘         └──────┬───────┘
                                   │ IPC (HTTP)
                            ┌──────┴───────┐
                            │  VS Code     │
                            │  Extension   │
                            └──────┬───────┘
                                   │ Webview
                            ┌──────┴───────┐
                            │  Review UI   │
                            │  (React)     │
                            └──────────────┘
```

The MCP server handles all email API communication. The extension provides authentication, review/approval panels, and status monitoring.

## Important Disclaimer

> **You are responsible for controlling your AI assistant.**
>
> While Mail MCP's default instructions tell the AI to use the review workflow before taking destructive actions, **there is no technical enforcement preventing the AI from calling tools directly.** The AI could delete, move, or unsubscribe from emails without presenting a review if it decides to bypass the workflow.
>
> The maintainers of Mail MCP are not responsible for any actions taken by AI assistants. It is your responsibility to:
> - Monitor what the AI is doing
> - Use AI clients that respect tool safety boundaries
> - Revoke access if the AI misbehaves
> - Keep backups of important emails
>
> The review system is a safety net, not a guarantee.
