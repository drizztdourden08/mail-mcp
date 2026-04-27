# Connection Types

Mail MCP supports different authentication methods depending on the provider. This page documents the available connection types.

---

## Device Code Flow

Device Code Flow is an OAuth 2.0 method designed for devices that don't have a web browser or have limited input capabilities. It works well for CLI tools and extensions.

### How it works

1. You click **Connect** in Mail MCP.
2. The extension shows you a **URL** and a **code**.
3. You open the URL in any browser (can be on a different device).
4. You enter the code and sign in with your account.
5. Once signed in, Mail MCP automatically detects the successful authentication.

### Why Device Code Flow?

- No need to configure redirect URIs
- Works even when the extension can't open a browser directly
- The sign-in happens in your browser where you may already be logged in
- Secure — the code expires after a short time

### Requirements

Your provider's app registration must have Device Code Flow enabled. Check your provider's setup documentation for specific instructions.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Code expired | Click Connect again to get a new code |
| Wrong account signed in | Sign out of your account in the browser first, then try again |
| "Application not found" | The provider's Client ID may be misconfigured |
| Flow not enabled | Check that "Allow public client flows" is enabled in your app registration |

---

## Other Connection Types

Additional authentication methods may be added by providers in the future (e.g., OAuth redirect, API keys, etc.). Check your specific provider's documentation for details.
