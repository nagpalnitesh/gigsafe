import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { generateDisputeContext } from "@/lib/ai-memory";
import { limits, getClientIP } from "@/lib/rate-limit";

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");
  return new Groq({ apiKey });
}

const SYSTEM_PROMPT = `You are GigSafe's AI Dispute Resolver — an impartial arbitrator for freelance payment disputes on the Solana blockchain.

You will receive:
- Gig details (title, milestones, amounts, deadline, current status)
- Client's evidence/argument
- Freelancer's evidence/argument

Your job is to determine a FAIR split of the remaining escrowed funds.

Rules:
1. Analyze both sides objectively based on evidence provided
2. Consider: work completion %, quality of deliverables described, adherence to requirements, timeline compliance, communication effort
3. If freelancer completed significant work, they deserve proportional payment
4. If client's requirements were unclear or changed, lean toward freelancer
5. If freelancer delivered nothing or ghosted, lean toward client
6. A 50/50 split is lazy — use it only when both sides are equally at fault

Respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "freelancer_bps": <number 0-10000>,
  "reasoning": "<2-3 sentence explanation>",
  "confidence": "<low|medium|high>"
}

Where freelancer_bps is basis points (e.g., 7000 = 70% to freelancer, 30% to client).`;

export async function POST(req: NextRequest) {
  try {
    // Rate limit (5 req/min for AI endpoints)
    const ip = getClientIP(req);
    const rl = limits.ai(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${Math.ceil(rl.resetIn / 1000)}s.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const body = await req.json();
    const { gigTitle, milestones, totalBudget, remainingAmount, clientEvidence, freelancerEvidence, milestoneStatuses } = body;

    if (!clientEvidence && !freelancerEvidence) {
      return NextResponse.json({ error: "At least one party must submit evidence" }, { status: 400 });
    }

    // Build context for the AI
    const milestonesDesc = milestones
      ?.map((m: { index: number; amount: number; status: string }, i: number) => `  ${i + 1}. Amount: ${m.amount} USDC — Status: ${m.status}`)
      .join("\n") || "No milestone details";

    // Generate AI memory context for better dispute resolution
    const completedCount = milestones?.filter((m: { status: string }) => m.status === "Approved").length ?? 0;
    const totalCount = milestones?.length ?? 1;
    const memoryContext = generateDisputeContext({
      gigTitle: gigTitle || "Untitled",
      budget: totalBudget,
      milestonesCompleted: completedCount,
      totalMilestones: totalCount,
      daysSinceCreation: 14, // approximate — could be derived from on-chain data
    });

    const userPrompt = `## Gig Details
- Title: ${gigTitle || "Untitled"}
- Total Budget: ${totalBudget} USDC
- Remaining in Escrow: ${remainingAmount} USDC
- Milestones:
${milestonesDesc}
${memoryContext}
## Client's Evidence & Argument
${clientEvidence || "(Client did not submit evidence)"}

## Freelancer's Evidence & Argument
${freelancerEvidence || "(Freelancer did not submit evidence)"}

Analyze and provide your ruling as JSON.`;

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    const ruling = JSON.parse(content);

    // Validate
    if (typeof ruling.freelancer_bps !== "number" || ruling.freelancer_bps < 0 || ruling.freelancer_bps > 10000) {
      return NextResponse.json({ error: "Invalid AI ruling — freelancer_bps out of range" }, { status: 500 });
    }

    return NextResponse.json({
      freelancer_bps: Math.round(ruling.freelancer_bps),
      client_bps: 10000 - Math.round(ruling.freelancer_bps),
      reasoning: ruling.reasoning || "No reasoning provided",
      confidence: ruling.confidence || "medium",
      model: "llama-3.3-70b-versatile",
    });
  } catch (err: unknown) {
    console.error("Dispute resolution error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
