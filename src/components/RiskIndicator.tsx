"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface RiskAssessment {
  score: number;
  level: "low" | "medium" | "high";
  factors: string[];
  suggestions: string[];
}

interface RiskIndicatorProps {
  budget: number;
  milestones: number;
  deadline: string; // date string
}

export function RiskIndicator({ budget, milestones, deadline }: RiskIndicatorProps) {
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!budget || !milestones || !deadline) {
      setRisk(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ budget, milestones, deadline }),
        });
        if (res.ok) {
          setRisk(await res.json());
        }
      } catch {}
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [budget, milestones, deadline]);

  if (!risk) return null;

  const colors = {
    low: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", bar: "bg-emerald-500" },
    medium: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", bar: "bg-yellow-500" },
    high: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", bar: "bg-red-500" },
  };
  const c = colors[risk.level];

  const Icon = risk.level === "low" ? CheckCircle2 : risk.level === "medium" ? AlertTriangle : Shield;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className={`p-4 rounded-xl ${c.bg} border ${c.border}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3"
      >
        <Icon className={`w-5 h-5 ${c.text}`} />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${c.text}`}>
              AI Risk Assessment: {risk.level.charAt(0).toUpperCase() + risk.level.slice(1)} Risk
            </span>
            <span className="text-xs text-gray-500">{risk.score}/100</span>
          </div>
          {/* Score bar */}
          <div className="h-1 rounded-full bg-white/5 mt-1.5 w-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${c.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${risk.score}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        <Info className="w-4 h-4 text-gray-500 shrink-0" />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 space-y-2"
        >
          {risk.factors.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Factors:</p>
              {risk.factors.map((f, i) => (
                <p key={i} className="text-xs text-gray-400 pl-3">• {f}</p>
              ))}
            </div>
          )}
          {risk.suggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Suggestions:</p>
              {risk.suggestions.map((s, i) => (
                <p key={i} className="text-xs text-emerald-400/80 pl-3">💡 {s}</p>
              ))}
            </div>
          )}
          <p className="text-[10px] text-gray-600 pt-1">
            Powered by GigSafe AI Memory — learns from platform patterns
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
