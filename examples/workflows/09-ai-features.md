# Workflow 9: AI Features

## Overview
GigSafe uses AI across four areas: dispute resolution, risk assessment, gig suggestions, and platform memory.

---

## 1. AI Dispute Resolution
**Endpoint:** POST /api/dispute/resolve
**Model:** Groq / Llama 3.3 70B
**Rate limit:** 5/min per IP

### How It Works
1. Both parties submit evidence text
2. AI receives: gig details, milestones, budget, evidence, platform memory context
3. Returns: freelancer/client split (basis points), reasoning, confidence
4. Executes on-chain via resolve_dispute instruction

### Example Request
```json
{
  "gigTitle": "Landing Page",
  "milestones": [
    { "index": 0, "amount": 100, "status": "Approved" },
    { "index": 1, "amount": 200, "status": "Submitted" },
    { "index": 2, "amount": 100, "status": "Pending" }
  ],
  "totalBudget": 400,
  "remainingAmount": 300,
  "clientEvidence": "Work was incomplete, only wireframes delivered...",
  "freelancerEvidence": "I delivered 3 iterations, client kept changing scope..."
}
```

### Example Response
```json
{
  "freelancer_bps": 6500,
  "client_bps": 3500,
  "reasoning": "Freelancer shows evidence of multiple iterations. Client's scope changes partially justify incomplete delivery. 65/35 split reflects work done vs expectations.",
  "confidence": "high",
  "model": "llama-3.3-70b-versatile"
}
```

---

## 2. AI Risk Assessment
**Endpoint:** POST /api/risk
**Source:** src/lib/ai-memory.ts

### How It Works
Shows in real-time as users fill out the create gig form.

### Risk Factors
| Factor | Impact | Suggestion |
|--------|--------|------------|
| Single milestone | -20 | "Break into 2-3 milestones" |
| Budget > 5000 | -10 | "Add more milestones for incremental delivery" |
| Budget < 10 | -15 | — |
| Deadline < 3 days | -15 | "Consider extending for quality work" |
| Deadline > 90 days | -5 | "Add milestone checkpoints" |
| Many milestones (>7) | -5 | — |

### Risk Levels
- **Low** (70-100): Safe to proceed
- **Medium** (40-69): Review suggestions
- **High** (0-39): Reconsider structure

### Example
```bash
curl -X POST https://gigsafe.wildsnap.in/api/risk \
  -H "Content-Type: application/json" \
  -d '{"budget":"200","milestones":"1","deadline":"2026-04-17"}'

# Response:
{
  "score": 45,
  "level": "medium",
  "factors": [
    "Single milestone — all-or-nothing risk",
    "Very tight deadline — rush jobs have higher dispute rates"
  ],
  "suggestions": [
    "Break into 2-3 milestones for safer incremental payments",
    "Consider extending deadline for quality work"
  ]
}
```

---

## 3. AI Gig Suggestions
**Endpoint:** POST /api/suggest
**Model:** Groq / Llama 3.3 70B

### How It Works
1. User types a gig title on the create page
2. Clicks "✨ AI Suggest" button
3. AI generates: description, milestones, amounts, category, deadline

### Example
```bash
curl -X POST https://gigsafe.wildsnap.in/api/suggest \
  -H "Content-Type: application/json" \
  -d '{"title":"Build a React Native food delivery app"}'

# Response:
{
  "description": "Develop a fully functional React Native mobile app...",
  "milestones": [
    { "name": "Planning and Design", "amount": 200 },
    { "name": "Frontend Development", "amount": 800 },
    { "name": "Backend Integration", "amount": 600 },
    { "name": "Testing and Debugging", "amount": 400 },
    { "name": "Launch and Deployment", "amount": 200 }
  ],
  "deadlineDays": 30,
  "category": "development"
}
```

---

## 4. Platform Memory (AI Memory System)
**Source:** src/lib/ai-memory.ts

### What It Remembers
- Dispute patterns (completion % before dispute → typical resolution)
- Gig patterns (common structures, pricing, timelines)
- User signals (completion rate, dispute rate, response time)

### How It's Used
- Injected into dispute resolution prompts as "Platform Context"
- Powers the risk assessment engine
- Foundation for future: fraud detection, match scoring, pricing suggestions

### Memory Context Example
```
## Platform Context (AI Memory)
- Completion: 70% of milestones approved before dispute
- Pattern match: High completion before dispute typically indicates
  final-milestone disagreement. Historical resolution: 70-80% to freelancer.
```

---

## Test Cases

### Dispute Resolution
1. Both evidence provided → balanced ruling
2. Only client evidence → may lean client
3. Only freelancer evidence → may lean freelancer
4. High completion (70%+) → favors freelancer
5. Zero completion → favors client
6. Rate limited after 5 requests/min

### Risk Assessment
1. 3 milestones, 30-day deadline → Low risk (80+)
2. 1 milestone → Medium risk (60)
3. 1 milestone + 2-day deadline → High risk (<40)
4. Missing fields → 400 error

### Suggestions
1. "Build a landing page" → 3 milestones, 14 days
2. "Smart contract audit" → 3 milestones, 21 days
3. Empty title → 400 error
4. Rate limited after 5 requests/min
