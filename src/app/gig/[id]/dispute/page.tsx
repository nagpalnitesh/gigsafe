"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  Shield,
  Bot,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Scale,
  CheckCircle2,
  Send,
  User,
} from "lucide-react";
import { useProgram } from "@/hooks/useProgram";
import { useToast } from "@/components/Toast";
import {
  fetchGig,
  GigAccountData,
  GIG_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  resolveDispute,
  fromSmallestUnits,
  shortenKey,
} from "@/lib/program";
import Link from "next/link";
import { notify } from "@/lib/notify";

interface AIRuling {
  freelancer_bps: number;
  client_bps: number;
  reasoning: string;
  confidence: string;
  model: string;
}

export default function DisputePage() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const program = useProgram();
  const toast = useToast();

  const [gig, setGig] = useState<GigAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clientEvidence, setClientEvidence] = useState("");
  const [freelancerEvidence, setFreelancerEvidence] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [ruling, setRuling] = useState<AIRuling | null>(null);
  const [executing, setExecuting] = useState(false);

  const gigPdaStr = params.id as string;

  const loadGig = useCallback(async () => {
    if (!program || !gigPdaStr) return;
    try {
      const gigPda = new PublicKey(gigPdaStr);
      const data = await fetchGig(program, gigPda);
      setGig(data);
      setError(null);
    } catch {
      setError("Gig not found or failed to load");
    } finally {
      setLoading(false);
    }
  }, [program, gigPdaStr]);

  useEffect(() => {
    if (!program) { setLoading(false); return; }
    setLoading(true);
    loadGig();
  }, [program, loadGig]);

  const handleAnalyze = async () => {
    if (!gig) return;
    if (!clientEvidence.trim() && !freelancerEvidence.trim()) {
      toast.error("At least one party must submit evidence");
      return;
    }

    setAnalyzing(true);
    setRuling(null);

    try {
      const milestones = gig.milestoneAmounts.map((amount, i) => ({
        index: i,
        amount: fromSmallestUnits(amount),
        status: MILESTONE_STATUS_LABELS[gig.milestoneStatuses[i]] ?? "Pending",
      }));

      const res = await fetch("/api/dispute/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigTitle: gig.title,
          milestones,
          totalBudget: fromSmallestUnits(gig.totalBudget),
          remainingAmount: fromSmallestUnits(
            new BN(gig.fundedAmount.toString()).sub(new BN(gig.releasedAmount.toString()))
          ),
          milestoneStatuses: Array.from(gig.milestoneStatuses).map(
            (s) => MILESTONE_STATUS_LABELS[s] ?? "Pending"
          ),
          clientEvidence: clientEvidence.trim(),
          freelancerEvidence: freelancerEvidence.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI analysis failed");
      }

      const data: AIRuling = await res.json();
      setRuling(data);
    } catch (err: unknown) {
      toast.error(`Error: ${err instanceof Error ? err.message : "Analysis failed"}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecuteRuling = async () => {
    if (!program || !gig || !ruling || !publicKey) return;

    setExecuting(true);
    const loadingId = toast.loading("Executing dispute resolution on-chain...");

    try {
      const tx = await resolveDispute(
        program,
        gig.client,
        gig.gigId,
        ruling.freelancer_bps,
        gig.freelancer,
        gig.client,
        gig.tokenMint
      );

      toast.dismiss(loadingId);
      toast.success("Dispute resolved on-chain! 🎉", {
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
              "_blank"
            ),
        },
      });

      // Notify both parties
      const splitDesc = `${(ruling.freelancer_bps / 100).toFixed(0)}% freelancer / ${(ruling.client_bps / 100).toFixed(0)}% client`;
      notify.disputeResolved(gig.client.toString(), gigPdaStr, gig.title, splitDesc);
      notify.disputeResolved(gig.freelancer.toString(), gigPdaStr, gig.title, splitDesc);

      // Redirect back to gig page
      setTimeout(() => router.push(`/gig/${gigPdaStr}`), 2000);
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      toast.error(`Error: ${err instanceof Error ? err.message : "Transaction failed"}`);
    } finally {
      setExecuting(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Dispute Resolution</h1>
        <p className="text-gray-400 mb-6">Connect your wallet to access dispute resolution</p>
        <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-lg !text-black" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">{error ?? "Gig not found"}</p>
      </div>
    );
  }

  const isDisputed = gig.status === 3;
  const isClient = publicKey?.toString() === gig.client.toString();
  const isFreelancer = publicKey?.toString() === gig.freelancer.toString();
  const isParty = isClient || isFreelancer;
  const remaining = fromSmallestUnits(
    new BN(gig.fundedAmount.toString()).sub(new BN(gig.releasedAmount.toString()))
  );

  if (!isDisputed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
        <p className="text-yellow-400 mb-2">This gig is not in disputed status</p>
        <p className="text-gray-500 text-sm mb-6">
          Status: {GIG_STATUS_LABELS[gig.status] ?? "Unknown"}
        </p>
        <Link href={`/gig/${gigPdaStr}`} className="text-emerald-400 hover:underline text-sm">
          ← Back to gig
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Link
          href={`/gig/${gigPdaStr}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to gig
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Dispute Resolution</h1>
            <p className="text-gray-500 text-sm">{gig.title}</p>
          </div>
        </div>

        {/* Escrow info */}
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 mt-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Remaining in Escrow</div>
              <div className="text-2xl font-bold">{remaining.toFixed(2)} USDC</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                Client: {shortenKey(gig.client.toString())}
              </div>
              <div className="text-xs text-gray-500">
                Freelancer: {shortenKey(gig.freelancer.toString())}
              </div>
            </div>
          </div>
        </div>

        {/* Evidence submission */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 text-purple-400" />
              Client&apos;s Evidence & Argument
              {isClient && (
                <span className="text-xs text-purple-400">(You)</span>
              )}
            </label>
            <textarea
              value={clientEvidence}
              onChange={(e) => setClientEvidence(e.target.value)}
              placeholder="Describe what happened from the client's perspective. What was delivered vs. expected? Any communication issues?"
              rows={4}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none text-sm resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 text-blue-400" />
              Freelancer&apos;s Evidence & Argument
              {isFreelancer && (
                <span className="text-xs text-blue-400">(You)</span>
              )}
            </label>
            <textarea
              value={freelancerEvidence}
              onChange={(e) => setFreelancerEvidence(e.target.value)}
              placeholder="Describe what happened from the freelancer's perspective. What work was completed? Were requirements clear?"
              rows={4}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none text-sm resize-none"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!clientEvidence.trim() && !freelancerEvidence.trim())}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold transition flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> AI is analyzing
                evidence...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5" /> Analyze with AI
              </>
            )}
          </button>
        </div>

        {/* AI Ruling */}
        {ruling && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold">AI Ruling</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    ruling.confidence === "high"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : ruling.confidence === "medium"
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {ruling.confidence} confidence
                </span>
              </div>

              {/* Split visualization */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-400">
                    Freelancer: {(ruling.freelancer_bps / 100).toFixed(1)}%
                  </span>
                  <span className="text-purple-400">
                    Client: {(ruling.client_bps / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-4 rounded-full bg-white/5 overflow-hidden flex">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${ruling.freelancer_bps / 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${ruling.client_bps / 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                  <div className="text-xs text-gray-400">Freelancer receives</div>
                  <div className="text-lg font-bold text-blue-400">
                    {((remaining * ruling.freelancer_bps) / 10000).toFixed(2)} USDC
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-center">
                  <div className="text-xs text-gray-400">Client refund</div>
                  <div className="text-lg font-bold text-purple-400">
                    {((remaining * ruling.client_bps) / 10000).toFixed(2)} USDC
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="text-xs text-gray-500 mb-1">AI Reasoning</div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {ruling.reasoning}
                </p>
              </div>

              <div className="text-xs text-gray-600 mt-3">
                Model: {ruling.model} · This is a recommendation, not financial advice
              </div>
            </div>

            {/* Execute button */}
            {isParty && (
              <button
                onClick={handleExecuteRuling}
                disabled={executing}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-black font-semibold transition flex items-center justify-center gap-2"
              >
                {executing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Executing on-chain...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Accept & Execute Ruling On-Chain
                  </>
                )}
              </button>
            )}

            <p className="text-xs text-gray-600 text-center">
              Executing will split the escrowed {remaining.toFixed(2)} USDC according to the AI ruling and close the escrow.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
