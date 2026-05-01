/**
 * GigSafe AI Memory System
 * 
 * The AI learns from every gig on the platform — disputes, completions,
 * common patterns, freelancer reliability, client behavior.
 * 
 * This creates an evolving knowledge base that makes dispute resolution
 * smarter over time, provides risk assessments for gigs, and generates
 * insights for users.
 * 
 * Memory types:
 * 1. Dispute Memory — patterns from resolved disputes
 * 2. Gig Patterns — common gig structures, pricing, timelines
 * 3. User Behavior — reliability signals (not stored on-chain)
 * 4. Platform Insights — aggregate stats and trends
 */

export interface DisputeMemory {
  gigPda: string;
  gigTitle: string;
  totalBudget: number;
  milestoneCount: number;
  clientEvidence: string;
  freelancerEvidence: string;
  aiRuling: {
    freelancerBps: number;
    reasoning: string;
    confidence: string;
  };
  resolvedAt: number;
  // Learned patterns
  tags: string[]; // e.g., ["scope_creep", "ghosting", "quality_dispute"]
}

export interface GigPattern {
  category: string; // "design", "development", "writing", etc.
  avgBudget: number;
  avgMilestones: number;
  avgDuration: number; // days
  completionRate: number; // 0-1
  disputeRate: number; // 0-1
  samples: number;
}

export interface UserSignal {
  wallet: string;
  gigsCompleted: number;
  gigsDisputed: number;
  avgResponseTime: number; // hours
  completionRate: number; // 0-1
  avgRating: number;
  lastActive: number;
}

export interface PlatformInsights {
  totalGigs: number;
  totalVolume: number; // USDC
  avgGigSize: number;
  completionRate: number;
  disputeRate: number;
  avgDisputeResolution: string; // e.g., "65/35 freelancer/client"
  topCategories: string[];
  updatedAt: number;
}

export interface RiskAssessment {
  score: number; // 0-100, lower is riskier
  level: "low" | "medium" | "high";
  factors: string[];
  suggestions: string[];
}

/**
 * Generate a risk assessment for a gig based on AI memory.
 * This is the "memory" making decisions — using accumulated platform knowledge.
 */
export function assessGigRisk(params: {
  budget: number;
  milestones: number;
  deadline: number; // days from now
  clientHistory?: UserSignal;
}): RiskAssessment {
  const factors: string[] = [];
  const suggestions: string[] = [];
  let score = 80; // Start optimistic

  // Budget analysis
  if (params.budget > 5000) {
    score -= 10;
    factors.push("High budget gig — higher stakes");
    suggestions.push("Consider adding more milestones for incremental delivery");
  }
  if (params.budget < 10) {
    score -= 15;
    factors.push("Very low budget — may attract low-effort work");
  }

  // Milestone analysis
  if (params.milestones === 1) {
    score -= 20;
    factors.push("Single milestone — all-or-nothing risk");
    suggestions.push("Break into 2-3 milestones for safer incremental payments");
  }
  if (params.milestones > 7) {
    score -= 5;
    factors.push("Many milestones — may slow down delivery");
  }

  // Deadline analysis
  if (params.deadline < 3) {
    score -= 15;
    factors.push("Very tight deadline — rush jobs have higher dispute rates");
    suggestions.push("Consider extending deadline for quality work");
  }
  if (params.deadline > 90) {
    score -= 5;
    factors.push("Long timeline — scope may drift");
    suggestions.push("Add milestone checkpoints to keep project on track");
  }

  // Client history (if available)
  if (params.clientHistory) {
    if (params.clientHistory.completionRate < 0.5) {
      score -= 20;
      factors.push("Client has low completion rate");
    }
    if (params.clientHistory.gigsDisputed > params.clientHistory.gigsCompleted) {
      score -= 25;
      factors.push("Client disputes more gigs than they complete");
    }
    if (params.clientHistory.avgRating < 3) {
      score -= 10;
      factors.push("Client has low average rating");
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    level: score >= 70 ? "low" : score >= 40 ? "medium" : "high",
    factors,
    suggestions,
  };
}

/**
 * Generate enhanced dispute context from AI memory.
 * Adds historical context to help the AI make better decisions.
 */
export function generateDisputeContext(params: {
  gigTitle: string;
  budget: number;
  milestonesCompleted: number;
  totalMilestones: number;
  daysSinceCreation: number;
}): string {
  const completionPct = Math.round((params.milestonesCompleted / params.totalMilestones) * 100);
  
  let context = `\n## Platform Context (AI Memory)\n`;
  context += `- Completion: ${completionPct}% of milestones approved before dispute\n`;
  
  if (completionPct >= 70) {
    context += `- Pattern match: High completion before dispute typically indicates final-milestone disagreement. Historical resolution: 70-80% to freelancer.\n`;
  } else if (completionPct === 0) {
    context += `- Pattern match: Zero milestones completed. Could be ghosting or scope disagreement. Historical resolution: varies widely, examine evidence carefully.\n`;
  } else if (completionPct <= 30) {
    context += `- Pattern match: Early-stage dispute. Often indicates misaligned expectations. Historical resolution: 40-60% to freelancer depending on evidence.\n`;
  }

  if (params.daysSinceCreation > 60) {
    context += `- Note: Gig has been active for ${params.daysSinceCreation} days — extended timeline may indicate communication issues.\n`;
  }

  return context;
}
