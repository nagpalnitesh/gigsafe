# Workflow 4: Dispute Resolution (AI-Powered)

## Overview
Either party raises a dispute. AI analyzes evidence and suggests a fair fund split. The ruling executes on-chain.

## Steps

### Step 1: Raise Dispute
1. On the gig detail page (must be Active status)
2. Either client or freelancer clicks "Raise Dispute"
3. Approve transaction → status changes to **Disputed** (red)
4. Other party gets notified: "Dispute Raised ⚠️"

### Step 2: Navigate to Dispute Resolution
1. "Resolve with AI" button appears (purple gradient)
2. Click → navigates to /gig/[id]/dispute

### Step 3: Submit Evidence
Both parties can enter their side:

**Client evidence (example):**
```
"Only received rough wireframes, not the polished design mockups we agreed on.
The freelancer missed two revision rounds and communication went dark for 5 days."
```

**Freelancer evidence (example):**
```
"I delivered 3 design iterations. The client kept changing requirements
without updating the brief. Original scope was a single homepage,
then they added 4 more pages without adjusting the budget."
```

### Step 4: AI Analysis
1. Click "Analyze with AI"
2. Loading: "AI is analyzing evidence..."
3. AI ruling appears with:
   - **Split visualization** (animated bar chart)
   - **Percentage split** (e.g., 70% freelancer / 30% client)
   - **Dollar amounts** (e.g., 140 USDC / 60 USDC)
   - **Reasoning** (2-3 sentences)
   - **Confidence level** (low/medium/high)
   - **Model used** (Llama 3.3 70B)

### Step 5: Execute Ruling On-Chain
1. Either party clicks "Accept & Execute Ruling On-Chain"
2. Approve transaction in Phantom
3. Escrow splits according to AI ruling:
   - Freelancer receives 70% → their wallet
   - Client receives 30% → their wallet
4. Status changes to **Resolved** (purple)
5. Both parties notified

## What Happens On-Chain
```
resolve_dispute instruction:
  - Caller can be either party (or authorized resolver)
  - freelancer_bps = 7000 (70%)
  - Transfers 70% of remaining escrow → freelancer ATA
  - Transfers 30% of remaining escrow → client ATA
  - Closes escrow account (rent returned)
  - Status: Disputed → Resolved
  - Emits DisputeResolved event
```

## AI Memory Context
The dispute resolver receives extra context from the AI memory system:

```
## Platform Context (AI Memory)
- Completion: 33% of milestones approved before dispute
- Pattern match: Early-stage dispute. Often indicates misaligned expectations.
  Historical resolution: 40-60% to freelancer depending on evidence.
```

This makes rulings smarter over time as the platform learns from disputes.

## AI Ruling Response Format
```json
{
  "freelancer_bps": 7000,
  "client_bps": 3000,
  "reasoning": "Freelancer delivered multiple iterations showing good faith effort. However, communication gaps and missed revision rounds indicate partial delivery. Given 1/3 milestones were completed, a 70/30 split reflects the work done.",
  "confidence": "high",
  "model": "llama-3.3-70b-versatile"
}
```

## Test Cases

### Standard Dispute
1. Gig is Active, 1/3 milestones approved
2. Client raises dispute → status = Disputed
3. Both submit evidence
4. AI suggests 65/35 split
5. Execute on-chain → funds distributed
6. Status = Resolved

### One-Sided Evidence
1. Only client submits evidence
2. AI notes: "(Freelancer did not submit evidence)"
3. Ruling still fair but may lean toward client

### Zero Completion Dispute
1. No milestones submitted, client raises dispute
2. AI pattern: "Zero milestones completed — examine evidence carefully"
3. Likely 80-90% refund to client

### Full Completion Dispute
1. 2/3 milestones approved, dispute on last
2. AI pattern: "High completion — typically 70-80% to freelancer"
3. Remaining escrow split accordingly

### Error Cases
- Dispute on non-active gig → **Error: gig not active**
- Resolve non-disputed gig → **Error: gig not in disputed status**
- Rate limit: max 5 AI requests per minute
