# Microsoft Exchange Setup

Connect Mail MCP to your Microsoft Exchange or Outlook mailbox.

> **Connection type:** This provider uses [Device Code Flow](connection-types) for authentication. See the Connection Types documentation for general information about how it works.

## Prerequisites

- A Microsoft account (personal `@outlook.com` / `@hotmail.com`) **or** a Microsoft 365 work/school account
- An Azure AD App Registration with the correct permissions

## 1 — Create an Azure App Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Fill in:
   - **Name**: `Mail MCP` (or any name you prefer)
   - **Supported account types**: select the type matching your account:
     - *Personal accounts only* → "Accounts in any organizational directory and personal Microsoft accounts"
     - *Work/school only* → "Accounts in this organizational directory only"
   - **Redirect URI**: leave blank (not needed for device code flow)
4. Click **Register**

## 2 — Configure API Permissions

1. In your new app registration, go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph** → **Delegated permissions**
3. Add these permissions:
   - `User.Read`
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `Mail.Send`
4. Click **Add permissions**
5. If using a work/school account, click **Grant admin consent** (requires admin)

## 3 — Enable Device Code Flow

1. Go to **Authentication** in your app registration
2. Under **Advanced settings**, set **Allow public client flows** to **Yes**
3. Click **Save**

## 4 — Copy Your Client ID

1. Go to the **Overview** page of your app registration
2. Copy the **Application (client) ID**

## 5 — Configure the Extension

The extension passes the client ID to the MCP server automatically. If you need to override it, set this environment variable before launching VS Code:

```
MAIL_MCP_CLIENT_ID=your-client-id-here
```

## Troubleshooting

| Problem | Solution |
|---|---|
| **AADSTS50059** error | Your tenant doesn't allow personal accounts. Re-create the app with the correct account type. |
| **Insufficient privileges** | Admin consent hasn't been granted. Ask your IT admin to grant consent for the app. |
| **Token cache issues** | Delete `~/.mail-mcp/token_cache.json` and sign in again. |
| **"Client ID not set"** | Make sure `MAIL_MCP_CLIENT_ID` is set in the environment or that the extension is configured. |
