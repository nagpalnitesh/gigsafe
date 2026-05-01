"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Loader2, Zap, Shield, AlertTriangle, CheckCircle2, Star, DollarSign, XCircle } from "lucide-react";
import Link from "next/link";
import { UserBadge } from "@/components/UserBadge";

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string | null;
  gigPda: string | null;
  gigTitle: string | null;
  actor: string | null;
  amount: number | null;
  createdAt: number;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  gig_created: { icon: Zap, color: "text-emerald-400" },
  gig_accepted: { icon: Shield, color: "text-blue-400" },
  milestone_submitted: { icon: Activity, color: "text-yellow-400" },
  milestone_approved: { icon: CheckCircle2, color: "text-emerald-400" },
  dispute_raised: { icon: AlertTriangle, color: "text-red-400" },
  dispute_resolved: { icon: DollarSign, color: "text-purple-400" },
  gig_cancelled: { icon: XCircle, color: "text-gray-400" },
  review_received: { icon: Star, color: "text-yellow-400" },
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function ActivityPage() {
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity?limit=50")
      .then((r) => r.json())
      .then(setFeed)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Platform Activity</h1>
            <p className="text-sm text-gray-500">Real-time feed of everything happening on GigSafe</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No activity yet. Create a gig to get started!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {feed.map((item, i) => {
              const cfg = typeConfig[item.type] ?? { icon: Activity, color: "text-gray-400" };
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition"
                >
                  <div className={`mt-0.5 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{item.title}</span>
                      {item.amount && (
                        <span className="text-xs text-emerald-400 font-bold">
                          {item.amount.toFixed(2)} USDC
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {item.actor && (
                        <UserBadge wallet={item.actor} size="sm" showAvatar={false} />
                      )}
                      {item.gigPda && (
                        <Link
                          href={`/gig/${item.gigPda}`}
                          className="text-[10px] text-emerald-400 hover:underline"
                        >
                          View gig →
                        </Link>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
