"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";
import { motion } from "framer-motion";
import {
  FileText,
  Coins,
  UserCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  Scale,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { GigAccountData, GIG_STATUS_LABELS, MILESTONE_STATUS_LABELS, fromSmallestUnits } from "@/lib/program";

interface TimelineEvent {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  timestamp?: number;
  txSignature?: string;
}

function buildTimelineFromState(gig: GigAccountData, milestoneNames?: string[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Created
  events.push({
    type: "created",
    label: "Gig Created",
    description: `"${gig.title}" with ${gig.milestoneCount} milestones`,
    icon: <FileText className="w-4 h-4" />,
    color: "text-gray-400",
    timestamp: gig.createdAt.toNumber(),
  });

  // Funded
  if (gig.fundedAmount.toNumber() > 0) {
    events.push({
      type: "funded",
      label: "Escrow Funded",
      description: `${fromSmallestUnits(gig.totalBudget).toFixed(2)} USDC locked in escrow`,
      icon: <Coins className="w-4 h-4" />,
      color: "text-emerald-400",
    });
  }

  // Accepted
  if (gig.freelancer.toString() !== PublicKey.default.toString()) {
    events.push({
      type: "accepted",
      label: "Freelancer Accepted",
      description: `${gig.freelancer.toString().slice(0, 4)}...${gig.freelancer.toString().slice(-4)} joined`,
      icon: <UserCheck className="w-4 h-4" />,
      color: "text-blue-400",
    });
  }

  // Milestones
  const statuses = Array.from(gig.milestoneStatuses);
  statuses.forEach((status, i) => {
    const msName = milestoneNames?.[i] || `Milestone ${i + 1}`;
    if (status >= 1) {
      events.push({
        type: "milestone-submitted",
        label: `${msName} Submitted`,
        description: `${fromSmallestUnits(gig.milestoneAmounts[i]).toFixed(2)} USDC`,
        icon: <Send className="w-4 h-4" />,
        color: "text-yellow-400",
      });
    }
    if (status >= 2) {
      events.push({
        type: "milestone-approved",
        label: `${msName} Approved`,
        description: `${fromSmallestUnits(gig.milestoneAmounts[i]).toFixed(2)} USDC released`,
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: "text-emerald-400",
      });
    }
  });

  // Status-based events
  if (gig.status === 3) {
    events.push({
      type: "disputed",
      label: "Dispute Raised",
      description: "Awaiting AI resolution",
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "text-red-400",
    });
  }

  if (gig.status === 4) {
    events.push({
      type: "resolved",
      label: "Dispute Resolved",
      description: "Funds distributed per AI ruling",
      icon: <Scale className="w-4 h-4" />,
      color: "text-purple-400",
    });
  }

  if (gig.status === 2) {
    events.push({
      type: "completed",
      label: "Gig Completed",
      description: "All milestones approved 🎉",
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "text-emerald-400",
    });
  }

  if (gig.status === 5) {
    events.push({
      type: "cancelled",
      label: "Gig Cancelled",
      description: "Funds refunded to client",
      icon: <XCircle className="w-4 h-4" />,
      color: "text-gray-400",
    });
  }

  return events;
}

export function GigTimeline({
  gig,
  gigPda,
  milestoneNames,
}: {
  gig: GigAccountData;
  gigPda: string;
  milestoneNames?: string[];
}) {
  const { connection } = useConnection();
  const [txHistory, setTxHistory] = useState<string[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const events = buildTimelineFromState(gig, milestoneNames);

  // Fetch recent tx signatures for this PDA
  useEffect(() => {
    setLoadingTx(true);
    connection
      .getSignaturesForAddress(new PublicKey(gigPda), { limit: 20 })
      .then((sigs) => setTxHistory(sigs.map((s) => s.signature)))
      .catch(() => {})
      .finally(() => setLoadingTx(false));
  }, [connection, gigPda]);

  return (
    <div>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        Activity Timeline
        {loadingTx && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
      </h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/5" />

        <div className="space-y-4">
          {events.map((event, i) => (
            <motion.div
              key={`${event.type}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 relative"
            >
              {/* Dot */}
              <div
                className={`w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 z-10 ${event.color}`}
              >
                {event.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{event.label}</span>
                  {event.timestamp && (
                    <span className="text-xs text-gray-600">
                      {new Date(event.timestamp * 1000).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      {txHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <h4 className="text-xs text-gray-500 mb-2">
            On-Chain Transactions ({txHistory.length})
          </h4>
          <div className="space-y-1">
            {txHistory.slice(0, 5).map((sig) => (
              <a
                key={sig}
                href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-emerald-400 transition py-1"
              >
                <code className="truncate flex-1">
                  {sig.slice(0, 20)}...{sig.slice(-8)}
                </code>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ))}
            {txHistory.length > 5 && (
              <a
                href={`https://explorer.solana.com/address/${gigPda}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:underline"
              >
                View all {txHistory.length} transactions →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
