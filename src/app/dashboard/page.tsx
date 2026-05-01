"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

import { Clock, Coins, ChevronRight, Loader2, Briefcase, TrendingUp, CheckCircle2 } from "lucide-react";
import { useProgram } from "@/hooks/useProgram";
import { Onboarding } from "@/components/Onboarding";
import { fetchAllGigs, GigAccountData, GIG_STATUS_LABELS, fromSmallestUnits, shortenKey } from "@/lib/program";

interface GigEntry {
  publicKey: PublicKey;
  account: GigAccountData;
}

const statusColors: Record<string, string> = {
  Open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  Disputed: "bg-red-500/10 text-red-400 border-red-500/20",
  Resolved: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function GigCard({ entry }: { entry: GigEntry }) {
  const gig = entry.account;
  const statusLabel = GIG_STATUS_LABELS[gig.status] ?? "Unknown";
  const budget = fromSmallestUnits(gig.totalBudget);
  const deadline = new Date(gig.deadline.toNumber() * 1000).toLocaleDateString();

  return (
    <Link href={`/gig/${entry.publicKey.toString()}`}>
      <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[statusLabel] ?? statusColors.Open}`}>
                {statusLabel}
              </span>
              <span className="text-xs text-gray-600">{gig.milestoneCount} milestones</span>
            </div>
            <h3 className="font-semibold group-hover:text-emerald-400 transition">{gig.title}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {deadline}</span>
              <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> {budget.toFixed(2)} USDC</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 mt-1 group-hover:text-emerald-400 transition shrink-0" />
        </div>
      </div>
    </Link>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-8 text-gray-600 text-sm">
      No {label} found.
    </div>
  );
}

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const program = useProgram();

  const [allGigs, setAllGigs] = useState<GigEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!program) { setLoading(false); return; }
    setLoading(true);
    fetchAllGigs(program)
      .then((data) => setAllGigs(data as GigEntry[]))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [program]);

  const myAddress = publicKey?.toString() ?? "";
  const clientGigs = useMemo(
    () => allGigs.filter((g) => g.account.client.toString() === myAddress),
    [allGigs, myAddress]
  );
  const freelancerGigs = useMemo(
    () => allGigs.filter((g) => g.account.freelancer.toString() === myAddress),
    [allGigs, myAddress]
  );

  // Stats
  const stats = useMemo(() => {
    const totalGigs = clientGigs.length + freelancerGigs.length;
    const activeGigs = [...clientGigs, ...freelancerGigs].filter(
      (g) => g.account.status === 1
    ).length;
    const completedGigs = [...clientGigs, ...freelancerGigs].filter(
      (g) => g.account.status === 2 || g.account.status === 4
    ).length;
    const disputedGigs = [...clientGigs, ...freelancerGigs].filter(
      (g) => g.account.status === 3
    ).length;

    // Total spent as client
    const totalSpent = clientGigs.reduce(
      (sum, g) => sum + fromSmallestUnits(g.account.releasedAmount),
      0
    );

    // Total earned as freelancer
    const totalEarned = freelancerGigs.reduce(
      (sum, g) => sum + fromSmallestUnits(g.account.releasedAmount),
      0
    );

    return { totalGigs, activeGigs, completedGigs, disputedGigs, totalSpent, totalEarned };
  }, [clientGigs, freelancerGigs]);

  if (!connected) {
    return <Onboarding />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-1 text-sm font-mono">{shortenKey(myAddress)}</p>
          </div>
          <Link href="/create"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-semibold transition text-center sm:w-auto w-full">
            Post a Gig
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<Briefcase className="w-3.5 h-3.5" />}
                label="Total Gigs"
                value={stats.totalGigs.toString()}
                sub={`${stats.activeGigs} active`}
              />
              <StatCard
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                label="Completed"
                value={stats.completedGigs.toString()}
                sub={stats.disputedGigs > 0 ? `${stats.disputedGigs} disputed` : undefined}
              />
              <StatCard
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="Total Earned"
                value={`${stats.totalEarned.toFixed(2)}`}
                sub="USDC"
              />
              <StatCard
                icon={<Coins className="w-3.5 h-3.5" />}
                label="Total Spent"
                value={`${stats.totalSpent.toFixed(2)}`}
                sub="USDC"
              />
            </div>

            {/* My Gigs as Client */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                My Gigs as Client
                <span className="text-sm text-gray-500 font-normal">({clientGigs.length})</span>
              </h2>
              {clientGigs.length === 0 ? (
                <EmptyState label="client gigs" />
              ) : (
                <div className="space-y-3">
                  {clientGigs.map((entry) => (
                    <GigCard key={entry.publicKey.toString()} entry={entry} />
                  ))}
                </div>
              )}
            </section>

            {/* My Gigs as Freelancer */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                My Gigs as Freelancer
                <span className="text-sm text-gray-500 font-normal">({freelancerGigs.length})</span>
              </h2>
              {freelancerGigs.length === 0 ? (
                <EmptyState label="freelancer gigs" />
              ) : (
                <div className="space-y-3">
                  {freelancerGigs.map((entry) => (
                    <GigCard key={entry.publicKey.toString()} entry={entry} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </div>
  );
}
