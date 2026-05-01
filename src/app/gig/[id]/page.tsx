"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Shield, Clock, Coins, User, CheckCircle2, Circle, AlertTriangle, Loader2, ExternalLink, Copy, Check, Scale, Share2 } from "lucide-react";
import { useProgram } from "@/hooks/useProgram";
import { useToast } from "@/components/Toast";
import {
  fetchGig,
  GigAccountData,
  GIG_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  acceptGig,
  submitMilestone,
  approveMilestone,
  requestDispute,
  cancelGig,
  fromSmallestUnits,
  shortenKey,
} from "@/lib/program";
import { timeAgo, formatDate } from "@/lib/utils";
import Link from "next/link";
import { GigTimeline } from "@/components/GigTimeline";
import { fetchGigMetadata, GigMetadata } from "@/lib/metadata";
import { FileUpload } from "@/components/FileUpload";
import { ReviewSection, ReputationBadge } from "@/components/ReviewSection";
import { UserBadge } from "@/components/UserBadge";
import { notify } from "@/lib/notify";
import { GigChat } from "@/components/GigChat";
import { getCategoryById } from "@/lib/categories";
import { InvoiceButton } from "@/components/InvoiceButton";
import { BidSection } from "@/components/BidSection";

function MilestoneIcon({ status }: { status: number }) {
  if (status === 2) return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  if (status === 1) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  return <Circle className="w-5 h-5 text-gray-600" />;
}

export default function GigDetailPage() {
  const params = useParams();
  const { connected, publicKey } = useWallet();
  const program = useProgram();
  const toast = useToast();

  const [gig, setGig] = useState<GigAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accepting, setAccepting] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [approving, setApproving] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [copiedPda, setCopiedPda] = useState(false);
  const [metadata, setMetadata] = useState<GigMetadata | null>(null);

  const gigPdaStr = params.id as string;

  const loadGig = useCallback(async () => {
    if (!program || !gigPdaStr) return;
    try {
      const gigPda = new PublicKey(gigPdaStr);
      const data = await fetchGig(program, gigPda);
      setGig(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gig not found or failed to load");
    } finally {
      setLoading(false);
    }
  }, [program, gigPdaStr]);

  useEffect(() => {
    if (!program) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadGig();
  }, [program, loadGig]);

  // Load off-chain metadata
  useEffect(() => {
    if (gigPdaStr) {
      fetchGigMetadata(gigPdaStr).then((m) => setMetadata(m));
    }
  }, [gigPdaStr]);

  const handleAccept = async () => {
    if (!program || !gig) return;
    setAccepting(true);
    const loadingId = toast.loading("Accepting gig...");
    try {
      const tx = await acceptGig(program, gig.gigId);
      toast.dismiss(loadingId);
      toast.success(`Gig accepted! View on Explorer →`, { action: { label: "Explorer", onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=devnet`, "_blank") } });
      // Notify client
      notify.gigAccepted(gig.client.toString(), gigPdaStr, gig.title);
      await loadGig();
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      toast.error(`Error: ${err instanceof Error ? err.message : "Transaction failed"}`);
    } finally {
      setAccepting(false);
    }
  };

  const handleSubmit = async (index: number) => {
    if (!program || !gig) return;
    setSubmitting(index);
    const loadingId = toast.loading(`Submitting milestone ${index + 1}...`);
    try {
      const tx = await submitMilestone(program, gig.gigId, index);
      toast.dismiss(loadingId);
      toast.success(`Milestone ${index + 1} submitted!`, { action: { label: "Explorer", onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=devnet`, "_blank") } });
      // Notify client
      notify.milestoneSubmitted(gig.client.toString(), gigPdaStr, gig.title, index, metadata?.milestoneNames?.[index]);
      await loadGig();
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      toast.error(`Error: ${err instanceof Error ? err.message : "Transaction failed"}`);
    } finally {
      setSubmitting(null);
    }
  };

  const handleApprove = async (index: number) => {
    if (!program || !gig || !publicKey) return;
    setApproving(index);
    const loadingId = toast.loading(`Approving milestone ${index + 1}...`);
    try {
      const tx = await approveMilestone(
        program,
        gig.client,
        gig.gigId,
        index,
        gig.freelancer,
        gig.tokenMint
      );
      toast.dismiss(loadingId);
      toast.success(`Milestone ${index + 1} approved & paid!`, { action: { label: "Explorer", onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=devnet`, "_blank") } });
      // Notify freelancer
      const msAmount = fromSmallestUnits(gig.milestoneAmounts[index]);
      notify.milestoneApproved(gig.freelancer.toString(), gigPdaStr, gig.title, index, msAmount.toFixed(2), metadata?.milestoneNames?.[index]);
      await loadGig();
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      toast.error(`Error: ${err instanceof Error ? err.message : "Transaction failed"}`);
    } finally {
      setApproving(null);
    }
  };

  const handleCancel = async () => {
    if (!program || !gig || !publicKey) return;
    setCancelling(true);
    const loadingId = toast.loading("Cancelling gig...");
    try {
      const tx = await cancelGig(program, gig.client, gig.gigId, gig.tokenMint);
      toast.dismiss(loadingId);
      toast.success(`Gig cancelled & refunded!`, { action: { label: "Explorer", onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=devnet`, "_blank") } });
      // Notify self
      notify.gigCancelled(gig.client.toString(), gigPdaStr, gig.title);
      await loadGig();
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      toast.error(`Error: ${err instanceof Error ? err.message : "Transaction failed"}`);
    } finally {
      setCancelling(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Connect Wallet</h1>
        <p className="text-gray-400 mb-6">Connect your wallet to view and interact with this gig</p>
        <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-lg !text-black" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Skeleton header */}
        <div className="animate-pulse space-y-4">
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-white/10" />
            <div className="h-5 w-12 rounded-full bg-white/10" />
          </div>
          <div className="h-9 w-2/3 rounded bg-white/10" />
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-4 w-28 rounded bg-white/10" />
          </div>
          <div className="h-12 w-full rounded-lg bg-white/5" />
          <div className="h-28 w-full rounded-xl bg-emerald-500/5 border border-emerald-500/10" />
          <div className="h-5 w-32 rounded bg-white/10" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full rounded-xl bg-white/[0.02] border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">{error ?? "Gig not found"}</p>
        <p className="text-gray-600 text-sm mt-2">PDA: {gigPdaStr}</p>
      </div>
    );
  }

  const statusLabel = GIG_STATUS_LABELS[gig.status] ?? "Unknown";
  const isClient = publicKey?.toString() === gig.client.toString();
  const isFreelancer = publicKey?.toString() === gig.freelancer.toString();
  const isOpen = gig.status === 0;
  const isActive = gig.status === 1;
  const isCompleted = gig.status === 2;
  const isFunded = gig.fundedAmount.gt(new BN(0));

  const totalBudget = fromSmallestUnits(gig.totalBudget);
  const milestoneStatuses = Array.from(gig.milestoneStatuses);
  const releasedAmount = fromSmallestUnits(gig.releasedAmount);
  const remainingAmount = totalBudget - releasedAmount;
  const deadlineDate = new Date(gig.deadline.toNumber() * 1000);
  const deadline = deadlineDate.toLocaleDateString();
  const now = new Date();
  const isOverdue = deadlineDate < now && (isOpen || isActive);
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline > 0 && (isOpen || isActive);

  const statusColorClass =
    statusLabel === "Open" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    statusLabel === "Active" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
    statusLabel === "Completed" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
    statusLabel === "Disputed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
    statusLabel === "Resolved" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
    "bg-gray-500/10 text-gray-400 border-gray-500/20";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColorClass}`}>
            {statusLabel}
          </span>
          {isFunded && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Funded ✓
            </span>
          )}
          {isOverdue && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
              ⏰ Overdue
            </span>
          )}
          {isUrgent && !isOverdue && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              ⚡ {daysUntilDeadline}d left
            </span>
          )}
          {metadata?.category && (() => {
            const cat = getCategoryById(metadata.category);
            return cat ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                {cat.icon} {cat.label}
              </span>
            ) : null;
          })()}
        </div>

        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold">{gig.title}</h1>
          <button
            onClick={() => {
              const url = `https://gigsafe.pixxmo.com/gig/${gigPdaStr}`;
              if (navigator.share) {
                navigator.share({ title: `GigSafe: ${gig.title}`, url });
              } else {
                navigator.clipboard.writeText(url);
                toast.success("Link copied!");
              }
            }}
            className="shrink-0 p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Share gig"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        {metadata?.description && (
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">{metadata.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">Client:</span>
            <UserBadge wallet={gig.client.toString()} />
            <ReputationBadge wallet={gig.client.toString()} />
          </span>
          {gig.freelancer.toString() !== PublicKey.default.toString() && (
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs">Freelancer:</span>
              <UserBadge wallet={gig.freelancer.toString()} />
              <ReputationBadge wallet={gig.freelancer.toString()} />
            </span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due {deadline}</span>
          <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> {totalBudget.toFixed(2)} USDC</span>
          {gig.createdAt && (
            <span className="text-gray-500" title={formatDate(gig.createdAt.toNumber())}>
              Created {timeAgo(gig.createdAt.toNumber())}
            </span>
          )}
        </div>

        {/* Role Badge */}
        {(isClient || isFreelancer) && (
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
              isClient
                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            }`}>
              <User className="w-3 h-3" />
              {isClient ? "You are the Client" : "You are the Freelancer"}
            </span>
          </div>
        )}

        {/* Progress Bar */}
        {gig.milestoneCount > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Progress</span>
              <span>{milestoneStatuses.filter(s => s === 2).length}/{gig.milestoneCount} milestones approved</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(milestoneStatuses.filter(s => s === 2).length / gig.milestoneCount) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Gig PDA */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 mb-6 flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 truncate">PDA: <span className="text-gray-400 font-mono">{gigPdaStr}</span></p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { navigator.clipboard.writeText(gigPdaStr); setCopiedPda(true); setTimeout(() => setCopiedPda(false), 2000); }}
              className="text-gray-500 hover:text-gray-300 transition"
            >
              {copiedPda ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={`https://explorer.solana.com/address/${gigPdaStr}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-emerald-400 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Budget breakdown */}
        <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs sm:text-sm text-gray-400">Total Escrow</div>
              <div className="text-lg sm:text-2xl font-bold">{totalBudget.toFixed(2)}</div>
              <div className="text-xs text-gray-500">USDC</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">Released</div>
              <div className="text-lg sm:text-2xl font-bold text-emerald-400">{releasedAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-500">USDC</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">Remaining</div>
              <div className="text-lg sm:text-2xl font-bold">{remainingAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-500">USDC</div>
            </div>
          </div>
          {/* Escrow bar */}
          <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500/60"
              style={{ width: `${totalBudget > 0 ? (releasedAmount / totalBudget) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <h3 className="font-semibold mb-4">Milestones ({gig.milestoneCount})</h3>
        <div className="space-y-3 mb-8">
          {gig.milestoneAmounts.map((amount, i) => {
            const msStatus = milestoneStatuses[i] ?? 0;
            const msLabel = MILESTONE_STATUS_LABELS[msStatus] ?? "Pending";
            const msAmount = fromSmallestUnits(amount);

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
                  msStatus === 2 ? "bg-emerald-500/5 border-emerald-500/20" :
                  msStatus === 1 ? "bg-yellow-500/5 border-yellow-500/20" :
                  "bg-white/[0.02] border-white/5"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <MilestoneIcon status={msStatus} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {metadata?.milestoneNames?.[i] || `Milestone ${i + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">{msLabel}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                  <div className="text-right">
                    <div className="font-bold text-sm sm:text-base">{msAmount.toFixed(2)} USDC</div>
                  </div>

                  {/* Freelancer: upload + submit pending milestone */}
                  {isFreelancer && msStatus === 0 && isActive && (
                    <div className="flex items-center gap-2">
                      <FileUpload gigPda={gigPdaStr} milestoneIndex={i} />
                      <button
                        onClick={() => handleSubmit(i)}
                        disabled={submitting === i}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition"
                      >
                        {submitting === i ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit"}
                      </button>
                    </div>
                  )}
                  {/* Client: approve submitted milestone */}
                  {isClient && msStatus === 1 && (
                    <button
                      onClick={() => handleApprove(i)}
                      disabled={approving === i}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition"
                    >
                      {approving === i ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve & Pay"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bidding section */}
        <BidSection
          gigPda={gigPdaStr}
          gigTitle={gig.title}
          clientWallet={gig.client.toString()}
          totalBudget={totalBudget}
          isOpen={isOpen}
          isFunded={isFunded}
        />

        {/* Accept button (for freelancers) */}
        {connected && isOpen && !isClient && isFunded && (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-800 text-black font-semibold transition flex items-center justify-center gap-2 mb-4"
          >
            {accepting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Accepting Gig...</>
            ) : (
              <><Shield className="w-5 h-5" /> Accept This Gig — {totalBudget.toFixed(2)} USDC Escrowed</>
            )}
          </button>
        )}

        {/* Raise Dispute button (for either party when active) */}
        {isActive && (isClient || isFreelancer) && (
          <button
            onClick={async () => {
              if (!program || !gig) return;
              setDisputing(true);
              const loadingId = toast.loading("Raising dispute...");
              try {
                const tx = await requestDispute(program, gig.gigId);
                toast.dismiss(loadingId);
                toast.success("Dispute raised!", {
                  action: {
                    label: "Explorer",
                    onClick: () => window.open(`https://explorer.solana.com/tx/${tx}?cluster=devnet`, "_blank"),
                  },
                });
                // Notify the other party
                const otherParty = isClient ? gig.freelancer.toString() : gig.client.toString();
                notify.disputeRaised(otherParty, gigPdaStr, gig.title);
                await loadGig();
              } catch (err: unknown) {
                toast.dismiss(loadingId);
                toast.error(`Error: ${err instanceof Error ? err.message : "Transaction failed"}`);
              } finally {
                setDisputing(false);
              }
            }}
            disabled={disputing}
            className="w-full py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold transition flex items-center justify-center gap-2 mb-3"
          >
            {disputing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Raising Dispute...</>
            ) : (
              <><AlertTriangle className="w-5 h-5" /> Raise Dispute</>
            )}
          </button>
        )}

        {/* Dispute resolution link (when disputed) */}
        {gig.status === 3 && (
          <Link
            href={`/gig/${gigPdaStr}/dispute`}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-white font-semibold transition flex items-center justify-center gap-2 mb-3 hover:from-purple-500/30 hover:to-blue-500/30"
          >
            <Scale className="w-5 h-5" /> Resolve with AI
          </Link>
        )}

        {/* Cancel button (for client, only when open/funded) */}
        {isClient && isOpen && isFunded && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold transition flex items-center justify-center gap-2 mt-2"
          >
            {cancelling ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Cancelling...</>
            ) : (
              "Cancel Gig & Refund"
            )}
          </button>
        )}

        {isCompleted && (
          <div className="text-center py-8 p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mt-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-1">Gig Completed! 🎉</h3>
            <p className="text-gray-400 text-sm mb-4">All milestones approved. {totalBudget.toFixed(2)} USDC released to freelancer.</p>
            <InvoiceButton
              gigPda={gigPdaStr}
              gigTitle={gig.title}
              clientWallet={gig.client.toString()}
              freelancerWallet={gig.freelancer.toString()}
              totalBudget={totalBudget.toFixed(2)}
              releasedAmount={releasedAmount.toFixed(2)}
              status={statusLabel}
              createdAt={gig.createdAt?.toString() ?? ""}
            />
          </div>
        )}

        {/* Reviews (completed/resolved gigs) */}
        {(gig.status === 2 || gig.status === 4) && gig.freelancer.toString() !== PublicKey.default.toString() && (
          <div className="mt-8 pt-6 border-t border-white/5">
            <h3 className="font-semibold mb-4">Reviews & Reputation</h3>
            <ReviewSection
              gigPda={gigPdaStr}
              gigTitle={gig.title}
              clientWallet={gig.client.toString()}
              freelancerWallet={gig.freelancer.toString()}
              isCompleted={gig.status === 2 || gig.status === 4}
            />
          </div>
        )}

        {/* Chat — only show when gig has a freelancer */}
        {gig.freelancer.toString() !== PublicKey.default.toString() && (
          <div className="mt-8 pt-6 border-t border-white/5">
            <GigChat
              gigPda={gigPdaStr}
              clientWallet={gig.client.toString()}
              freelancerWallet={gig.freelancer.toString()}
            />
          </div>
        )}

        {/* Activity Timeline */}
        <div className="mt-10 pt-8 border-t border-white/5">
          <GigTimeline gig={gig} gigPda={gigPdaStr} milestoneNames={metadata?.milestoneNames} />
        </div>

        <p className="text-xs text-gray-600 text-center mt-8">
          All transactions are on Solana devnet. Program: 2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4
        </p>
      </motion.div>
    </div>
  );
}
