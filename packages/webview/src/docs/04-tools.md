# Tool Reference

This is a reference for all tools the AI can use when connected to your mailbox. Understanding these helps you monitor what the AI is doing.

---

## Authentication Tools

### auth.login
Starts the sign-in flow for your email provider. The specific method (device code, OAuth redirect, etc.) depends on the provider.

### auth.logout
Clears the current session. You'll need to sign in again to use email tools.

---

## Email Tools

### email.list
Lists emails in a folder (defaults to Inbox). Supports pagination.

### email.search
Searches emails by keywords. Useful for finding specific messages quickly.

### email.read
Reads a full email — body, headers, attachments metadata.

### email.move
Moves emails to a different folder. Up to 50 at a time. **Destructive** — should go through review.

### email.delete
Permanently deletes emails. Up to 50 at a time. **Destructive** — should go through review.

---

## Folder Tools

### folder.list
Lists your top-level mail folders with message counts and unread counts.

### folder.tree
Gets your full folder hierarchy (nested subfolders).

---

## Cache Tools

The cache allows the AI to analyze large numbers of emails without making repeated API calls. Messages are downloaded once, then searched/filtered locally.

### cache.sync
Downloads messages into memory. Can sync up to 500 messages at once.

### cache.stats
Checks if the cache is already loaded (avoids redundant syncs).

### cache.search
Regex search across cached messages — subject, body, sender, etc.

### cache.filter
Filter by criteria: read/unread, has unsubscribe option, sender pattern, date range.

### cache.get
Retrieves a specific cached message by ID.

### cache.clear
Frees memory. Should be called when the AI is done analyzing.

---

## Review Tools

The review system is how the AI presents proposed actions for your approval.

### review.create
Creates a new review with a title and column definitions.

### review.add_items
Adds items (emails) to the review table. Can be called multiple times.

### review.remove_items
Removes items from a review by ID. The review must be in "building" state.

### review.update
Changes the review status. Transitions: building→pending (present to user), pending→building (reopen for edits), any→closed. Optionally sets whether items are selected by default.

### review.await
Waits for your decision. The AI pauses here until you approve or reject.

### review.list
Lists any active reviews.

### review.close
Cleans up a completed review.

---

## Unsubscribe Tools

### unsubscribe.check
Checks if messages have unsubscribe mechanisms available.

### unsubscribe.execute
Executes unsubscribe for selected messages. **Destructive** — should go through review.
