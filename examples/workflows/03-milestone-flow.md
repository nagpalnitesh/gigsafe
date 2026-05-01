# Workflow 3: Milestone Submit → Approve → Payment

## Overview
The core payment loop. Freelancer submits work, client approves, USDC flows instantly.

## Steps

### Step 1: Freelancer Uploads Deliverable
1. On gig detail page, find the milestone
2. Click "Upload Deliverable" button
3. Select file (images, PDF, ZIP, text — max 10MB)
4. File uploads and appears with download link

### Step 2: Freelancer Submits Milestone
1. Click "Submit" on the milestone row
2. Approve transaction in Phantom
3. Milestone status: Pending → **Submitted** (yellow)
4. Client gets notified: "Milestone Submitted"

### Step 3: Client Reviews
1. Client sees milestone is "Submitted"
2. Downloads/reviews the deliverable
3. Uses in-gig chat to discuss if needed

### Step 4: Client Approves & Pays
1. Click "Approve & Pay" on the submitted milestone
2. Approve transaction in Phantom
3. **USDC transfers instantly from escrow → freelancer wallet**
4. Milestone status: Submitted → **Approved** (green)
5. Progress bar updates
6. Released amount updates in budget breakdown

### Step 5: Repeat for Remaining Milestones
- Each milestone follows the same submit → approve cycle
- When ALL milestones are approved → Gig status = **Completed**
- "Gig Completed! 🎉" banner appears
- Download Receipt button becomes available

## What Happens On-Chain

### submit_milestone
```
- Caller must be gig.freelancer
- Gig must be Active
- Milestone must be Pending
- Sets milestone_status[index] = Submitted
- Emits MilestoneSubmitted event
```

### approve_milestone
```
- Caller must be gig.client
- Milestone must be Submitted
- Transfers milestone_amount from escrow → freelancer ATA
- Sets milestone_status[index] = Approved
- Updates released_amount
- If all milestones approved → status = Completed
- Emits MilestoneApproved event
```

## Notifications
| Event | Who | Message |
|-------|-----|---------|
| Submit | Client | "Design Mockups submitted for review" |
| Approve | Freelancer | "Design Mockups approved. 50.00 USDC sent!" |
| All done | Both | "Gig Completed! 🎉" |

## File Upload Details
```
Accepted types: PNG, JPEG, GIF, WebP, PDF, ZIP, TXT, MD, JSON
Max size: 10MB
Storage: /uploads/<gigPda>/<filename>
Served at: /api/upload/<gigPda>/<filename>
Reference stored in: SQLite files table
```

## Test Cases

### Happy Path
1. Freelancer submits milestone 1 → status = Submitted
2. Client approves milestone 1 → 50 USDC transferred
3. Freelancer submits milestone 2 → status = Submitted
4. Client approves milestone 2 → 100 USDC transferred
5. Freelancer submits milestone 3 → status = Submitted
6. Client approves milestone 3 → 50 USDC transferred
7. Gig status = Completed

### Error Cases
- Submit when not freelancer → **Error: unauthorized**
- Submit already-submitted milestone → **Error: already submitted**
- Approve when not client → **Error: unauthorized**
- Approve non-submitted milestone → **Error: not submitted**
- Approve after gig cancelled → **Error: gig not active**

### Partial Completion
- Client approves milestones 1 and 2, disputes milestone 3
- 150 USDC released, 50 USDC goes to dispute
