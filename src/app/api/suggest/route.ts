import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { limits, getClientIP } from "@/lib/rate-limit";

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");
  return new Groq({ apiKey });
}

const SYSTEM_PROMPT = `You are GigSafe's AI assistant helping clients structure freelance gigs.

Given a gig title and optional description, suggest:
1. A clear description (if not provided)
2. Milestone breakdown with names and suggested USDC amounts
3. Suggested deadline in days

Respond with ONLY valid JSON (no markdown):
{
  "description": "string (2-3 sentences if not provided, or improved version)",
  "milestones": [
    { "name": "string", "amount": number }
  ],
  "deadlineDays": number,
  "category": "string (one of: development, design, writing, marketing, video, audio, consulting, data, security, translation, other)"
}

Guidelines:
- 2-5 milestones is ideal
- First milestone should be planning/design (smaller)
- Last milestone should be review/launch (smaller)
- Middle milestones are the main work (larger)
- Total budget should be reasonable for the work described
- Amounts in USDC (whole numbers preferred)`;

export async function POST(req: NextRequest) {
  try {
    const rl = limits.ai(getClientIP(req));
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${Math.ceil(rl.resetIn / 1000)}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const groq = getGroq();
    const userPrompt = `Gig title: "${title}"${description ? `\nDescription: "${description}"` : ""}\n\nSuggest milestone structure.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    const suggestion = JSON.parse(content);

    // Validate
    if (!suggestion.milestones || !Array.isArray(suggestion.milestones)) {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
    }

    return NextResponse.json(suggestion);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Suggestion failed" },
      { status: 500 }
    );
  }
}
