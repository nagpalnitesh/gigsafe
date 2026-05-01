"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { Shield, Clock, User, ChevronRight, Loader2, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { useProgram } from "@/hooks/useProgram";
import { fetchAllGigs, GigAccountData, GIG_STATUS_LABELS, fromSmallestUnits } from "@/lib/program";
import { timeAgo } from "@/lib/utils";
import { Onboarding } from "@/components/Onboarding";
import { UserBadge } from "@/components/UserBadge";
import { GIG_CATEGORIES, getCategoryLabel } from "@/lib/categories";
import { NETWORK } from "@/lib/config";

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

const ALL_STATUSES = ["All", "Open", "Active", "Completed", "Disputed", "Resolved", "Cancelled"];

type SortField = "newest" | "oldest" | "budget-high" | "budget-low" | "deadline";

function GigSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-6 w-20 rounded bg-white/10" />
          <div className="h-3 w-10 rounded bg-white/10 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export default function GigsPage() {
  const program = useProgram();
  const [gigs, setGigs] = useState<GigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortField>("newest");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [gigMetadata, setGigMetadata] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const GIGS_PER_PAGE = 10;

  useEffect(() => {
    if (!program) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetchAllGigs(program),
      fetch("/api/metadata").then(r => r.json()).catch(() => ({})),
    ])
      .then(([data, meta]) => {
        setGigs(data as GigEntry[]);
        setGigMetadata(meta);
        setError(null);
      })
      .catch((err) => { console.error(err); setError("Failed to load gigs from chain"); })
      .finally(() => setLoading(false));
  }, [program]);

  const filteredGigs = useMemo(() => {
    let result = [...gigs];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) =>
        g.account.title.toLowerCase().includes(q) ||
        g.account.client.toString().toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((g) => {
        const label = GIG_STATUS_LABELS[g.account.status] ?? "Unknown";
        return label === statusFilter;
      });
    }

    // Category filter
    if (categoryFilter !== "All") {
      result = result.filter((g) => {
        const meta = gigMetadata[g.publicKey.toString()];
        return meta?.category === categoryFilter;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.account.createdAt.toNumber() - a.account.createdAt.toNumber();
        case "oldest":
          return a.account.createdAt.toNumber() - b.account.createdAt.toNumber();
        case "budget-high":
          return b.account.totalBudget.toNumber() - a.account.totalBudget.toNumber();
        case "budget-low":
          return a.account.totalBudget.toNumber() - b.account.totalBudget.toNumber();
        case "deadline":
          return a.account.deadline.toNumber() - b.account.deadline.toNumber();
        default:
          return 0;
      }
    });

    return result;
  }, [gigs, searchQuery, statusFilter, categoryFilter, sortBy, gigMetadata]);

  // Pagination
  const totalPages = Math.ceil(filteredGigs.length / GIGS_PER_PAGE);
  const paginatedGigs = filteredGigs.slice((page - 1) * GIGS_PER_PAGE, page * GIGS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, categoryFilter, sortBy]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Browse Gigs</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Find work. Get paid instantly. Keep 99.5%.</p>
          </div>
          <Link href="/create"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-semibold transition text-center sm:w-auto w-full">
            Post a Gig
          </Link>
        </div>

        {/* Search & Filter Bar */}
        {program && !loading && gigs.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or address..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2.5 rounded-xl border text-sm transition flex items-center gap-2 ${
                  showFilters || statusFilter !== "All" || categoryFilter !== "All" || sortBy !== "newest"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                {/* Status filter */}
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1.5 block">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          statusFilter === s
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCategoryFilter("All")}
                      className={`px-2.5 py-1 rounded-lg text-xs transition ${
                        categoryFilter === "All"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
                      }`}
                    >All</button>
                    {GIG_CATEGORIES.filter(c => c.id !== "other").map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          categoryFilter === cat.id
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="sm:w-48">
                  <label className="text-xs text-gray-500 mb-1.5 block">Sort by</label>
                  <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortField)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm appearance-none focus:border-emerald-500/50 focus:outline-none"
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="budget-high">Budget: High → Low</option>
                      <option value="budget-low">Budget: Low → High</option>
                      <option value="deadline">Deadline: Soonest</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results count */}
            {(searchQuery || statusFilter !== "All") && (
              <div className="text-xs text-gray-500">
                {filteredGigs.length} gig{filteredGigs.length !== 1 ? "s" : ""} found
                {statusFilter !== "All" && <span> · Status: {statusFilter}</span>}
                {searchQuery && <span> · Search: &quot;{searchQuery}&quot;</span>}
              </div>
            )}
          </div>
        )}

        {!program && <Onboarding />}

        {program && loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <GigSkeleton key={i} />)}
          </div>
        )}

        {program && !loading && error && (
          <div className="text-center py-16 text-red-400">
            <p>{error}</p>
          </div>
        )}

        {program && !loading && !error && gigs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-emerald-400 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No gigs on-chain yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Be the first to post a gig and start working with trustless escrow payments.
            </p>
            <Link href="/create" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-semibold transition">
              Post the First Gig
            </Link>
          </div>
        )}

        {program && !loading && !error && gigs.length > 0 && filteredGigs.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No gigs match your filters</p>
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("All"); setCategoryFilter("All"); setSortBy("newest"); }}
              className="mt-3 text-sm text-emerald-400 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {!loading && filteredGigs.length > 0 && (
          <div className="space-y-4">
            {paginatedGigs.map((entry, i) => {
              const gig = entry.account;
              const statusLabel = GIG_STATUS_LABELS[gig.status] ?? "Unknown";
              const budget = fromSmallestUnits(gig.totalBudget);
              const deadline = new Date(gig.deadline.toNumber() * 1000).toLocaleDateString();
              const created = timeAgo(gig.createdAt.toNumber());

              return (
                <motion.div
                  key={entry.publicKey.toString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/gig/${entry.publicKey.toString()}`}>
                    <div className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[statusLabel] ?? statusColors.Open}`}>
                              {statusLabel}
                            </span>
                            <span className="text-xs text-gray-600">{gig.milestoneCount} milestones</span>
                            <span className="text-xs text-gray-600">· {created}</span>
                            {gigMetadata[entry.publicKey.toString()]?.category && (
                              <span className="text-xs text-gray-600">
                                {GIG_CATEGORIES.find(c => c.id === gigMetadata[entry.publicKey.toString()]?.category)?.icon ?? ""}{" "}
                                {getCategoryLabel(gigMetadata[entry.publicKey.toString()]?.category)}
                              </span>
                            )}
                          </div>
                          <h2 className="text-lg font-semibold group-hover:text-emerald-400 transition mb-1">
                            {gig.title}
                          </h2>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                            <span className="flex items-center gap-1"><UserBadge wallet={gig.client.toString()} size="sm" /></span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {deadline}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold text-emerald-400">{budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-xs text-gray-500">USDC</div>
                          <ChevronRight className="w-4 h-4 text-gray-600 mt-2 ml-auto group-hover:text-emerald-400 transition" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >Previous</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3), Math.min(totalPages, page + 2)
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm transition ${
                    p === page
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >{p}</button>
              ))}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >Next</button>
          </div>
        )}

        {!loading && (
          <div className="flex items-center gap-2 justify-center mt-4 text-xs text-gray-600">
            {program ? (
              <>Live data from Solana {NETWORK === "devnet" ? "devnet" : "mainnet"} · {filteredGigs.length} gig{filteredGigs.length !== 1 ? "s" : ""}{filteredGigs.length !== gigs.length ? ` (${gigs.length} total)` : ""}</>
            ) : (
              "Connect wallet to load live gigs"
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
