import { NextRequest, NextResponse } from "next/server";
import { assessGigRisk } from "@/lib/ai-memory";

// POST /api/risk — get AI risk assessment for a gig
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { budget, milestones, deadline } = body;

    if (!budget || !milestones || !deadline) {
      return NextResponse.json({ error: "budget, milestones, deadline required" }, { status: 400 });
    }

    // Calculate days until deadline
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const assessment = assessGigRisk({
      budget: parseFloat(budget),
      milestones: parseInt(milestones),
      deadline: daysUntilDeadline,
    });

    return NextResponse.json(assessment);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Assessment failed" },
      { status: 500 }
    );
  }
}
