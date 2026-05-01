# Workflow 8: In-Gig Messaging

## Overview
Client and freelancer communicate within the gig context. Messages persist across sessions.

## How It Works

### Access Chat
1. Navigate to any gig detail page where a freelancer is assigned
2. "Chat" section appears at the bottom (collapsible)
3. Click to expand

### Send Messages
1. Type in the message input
2. Press Enter or click Send button
3. Message appears instantly (optimistic)
4. Polls for new messages every 5 seconds

### Message Display
- Messages shown in bubble UI
- Your messages: right-aligned, green tint
- Their messages: left-aligned, neutral
- Sender shown via UserBadge (name, not just wallet)
- Timestamps shown (relative: "2m ago", "3h ago")

### Who Can Chat
- Only the gig's client and freelancer can send messages
- Others see "Only the client and freelancer can chat"
- Chat shows for all gig statuses (Active, Disputed, Completed)

## API Examples

### Send a message
```bash
curl -X POST https://gigsafe.wildsnap.in/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "gigPda": "ABC123...",
    "sender": "client-wallet",
    "message": "Hey, how is the progress on milestone 2?"
  }'
```

### Get messages
```bash
curl "https://gigsafe.wildsnap.in/api/messages?gigPda=ABC123..."
# Returns: [{ id, sender, message, timestamp }, ...]
```

## Rate Limiting
- 30 messages per minute per IP
- Max 1000 characters per message
- Empty/whitespace-only messages rejected

## Database
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  gig_pda TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER
);
-- Max 200 messages per gig
```

## Test Cases

### Happy Path
1. Client sends "How's it going?"
2. Freelancer receives it (within 5s poll)
3. Freelancer replies "Almost done!"
4. Client sees the reply
5. Conversation persists after page reload

### Edge Cases
- Send empty message → rejected
- Send 1001+ char message → rejected
- Non-party tries to send → UI blocks it
- Chat on gig with no freelancer → section hidden
- Rapid messages → rate limited after 30/min
