# Workflows & Examples

## How the Review System Works

When the AI wants to modify your mailbox, it should follow this pattern:

```
AI analyzes emails → builds a review table → you approve/reject → AI acts on approved only
```

1. The AI analyzes your emails (reading, searching, filtering).
2. It creates a review — a table showing what it proposes to do.
3. You see the review in the VS Code panel with checkboxes.
4. You select which items to approve (or reject the whole batch).
5. The AI only acts on what you explicitly approved.

> **Note:** The AI is *instructed* to use this workflow, but it is not technically forced to. Monitor its actions and revoke access if it misbehaves.

## Example: Inbox Cleanup

Ask your AI: *"Help me clean up my inbox — find newsletters and junk."*

What happens:
1. AI syncs your inbox into cache (fast local copy)
2. AI searches/filters for patterns (newsletters, promotions, etc.)
3. AI presents a review: "I found 47 emails to clean up"
4. You review the table, uncheck anything you want to keep
5. AI moves or deletes only what you approved

## Example: Bulk Unsubscribe

Ask your AI: *"Find all mailing lists I can unsubscribe from."*

What happens:
1. AI scans your inbox for emails with unsubscribe options
2. AI categorizes them (newsletters vs. important)
3. AI presents a review showing each mailing list
4. You pick which ones to unsubscribe from
5. AI executes unsubscribe for your selections

## Example: Find & Organize

Ask your AI: *"Find all emails from my bank and move them to a Finance folder."*

What happens:
1. AI searches for emails from your bank
2. Presents a review of what it found
3. You approve the ones to move
4. AI moves them to the target folder

## Tips

- The AI can process hundreds of emails at once using the cache
- You can ask it to categorize, score, or summarize emails before reviewing
- Multiple reviews can run concurrently if the AI works in parallel
- After large operations, the AI should clear its cache to free memory
