"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Plus, Trash2, Shield, Loader2, Sparkles } from "lucide-react";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "@/hooks/useProgram";
import { useToast } from "@/components/Toast";
import { createGig, fundGig, deriveGigPDA, toSmallestUnits } from "@/lib/program";
import { DEVNET_USDC } from "@/lib/constants";
import { saveGigMetadata } from "@/lib/metadata";
import { RiskIndicator } from "@/components/RiskIndicator";
import { notify } from "@/lib/notify";
import { GIG_CATEGORIES } from "@/lib/categories";
import { GIG_TEMPLATES, GigTemplate } from "@/lib/templates";

interface Milestone {
  name: string;
  amount: string;
}

export default function CreateGigPage() {
  const { connected } = useWallet();
  const program = useProgram();
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: "Milestone 1", amount: "" },
  ]);
  const [deadline, setDeadline] = useState("");
  const [token] = useState<"USDC">("USDC");
  const [category, setCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [suggesting, setSuggesting] = useState(false);

  const handleAISuggest = async () => {
    if (!title.trim()) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.description && !description) setDescription(data.description);
        if (data.milestones) {
          setMilestones(data.milestones.map((m: any) => ({
            name: m.name, amount: String(m.amount),
          })));
        }
        if (data.category) setCategory(data.category);
        if (data.deadlineDays) {
          const d = new Date();
          d.setDate(d.getDate() + data.deadlineDays);
          setDeadline(d.toISOString().split("T")[0]);
        }
        toast.success("AI suggestions applied! ✨");
      } else {
        const err = await res.json();
        toast.error(err.error || "AI suggestion failed");
      }
    } catch {
      toast.error("Failed to get AI suggestions");
    } finally {
      setSuggesting(false);
    }
  };

  const applyTemplate = (template: GigTemplate) => {
    setTitle(template.name);
    setDescription(template.description);
    setCategory(template.category);
    setMilestones(template.milestones);
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + template.suggestedDeadlineDays);
    setDeadline(deadlineDate.toISOString().split("T")[0]);
    setShowTemplates(false);
  };

  const totalBudget = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  const addMilestone = () => {
    if (milestones.length >= 10) return;
    setMilestones([...milestones, { name: `Milestone ${milestones.length + 1}`, amount: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleCreate = async () => {
    if (!title || milestones.some((m) => !m.name || !m.amount) || !deadline) return;
    if (!program) {
      toast.error("Wallet not connected");
      return;
    }

    setCreating(true);

    // Convert deadline date string to unix timestamp
    const deadlineTs = new BN(Math.floor(new Date(deadline).getTime() / 1000));

    // Use Date.now() as unique gig ID
    const gigId = new BN(Date.now());

    // Convert milestone amounts to smallest units (USDC: 6 decimals)
    const milestoneAmounts = milestones.map((m) => toSmallestUnits(parseFloat(m.amount)));

    let loadingId: string | null = null;
    try {
      loadingId = toast.loading("Creating gig on-chain...");

      // Step 1: createGig
      const createTx = await createGig(
        program,
        gigId,
        title,
        milestoneAmounts,
        deadlineTs,
        DEVNET_USDC
      );
      console.log("createGig tx:", createTx);
      toast.dismiss(loadingId);

      loadingId = toast.loading("Funding escrow...");

      // Step 2: fundGig
      const fundTx = await fundGig(program, gigId);
      console.log("fundGig tx:", fundTx);
      toast.dismiss(loadingId);
      loadingId = null;

      // Get wallet pubkey from program provider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clientPubkey = (program.provider as any).wallet.publicKey;
      const [gigPda] = deriveGigPDA(clientPubkey, gigId);

      // Save off-chain metadata
      saveGigMetadata(gigPda.toString(), {
        description: description.trim() || undefined,
        milestoneNames: milestones.map((m) => m.name),
        category: category || undefined,
        createdBy: clientPubkey.toString(),
      });

      toast.success("Gig created and funded! 🎉");

      // Notify self
      notify.gigCreated(clientPubkey.toString(), gigPda.toString(), title);

      // Redirect to gig detail page
      router.push(`/gig/${gigPda.toString()}`);
    } catch (err: unknown) {
      if (loadingId) toast.dismiss(loadingId);
      const message = err instanceof Error ? err.message : "Transaction failed";
      toast.error(`Error: ${message}`);
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Post a Gig</h1>
        <p className="text-gray-400 mb-6">Connect your wallet to create an escrow gig</p>
        <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-lg !text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Post a Gig</h1>
        <p className="text-gray-400 mb-8">Create an escrow gig with milestone payments. Funds are locked until you approve.</p>

        {/* Templates */}
        {showTemplates && !title && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400">Start from a template</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-xs text-gray-600 hover:text-gray-400 transition"
              >Skip — start blank</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GIG_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-sm font-medium group-hover:text-emerald-400 transition">{t.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                    <span>{t.milestones.length} milestones</span>
                    <span>·</span>
                    <span>{t.milestones.reduce((s, m) => s + parseFloat(m.amount), 0)} USDC</span>
                    <span>·</span>
                    <span>{t.suggestedDeadlineDays}d</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-400">Gig Title *</label>
              {title.trim() && (
                <button
                  onClick={handleAISuggest}
                  disabled={suggesting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/20 transition disabled:opacity-50"
                >
                  {suggesting ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Thinking...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> AI Suggest</>
                  )}
                </button>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Build a landing page for my startup"
              maxLength={64}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work, requirements, deliverables..."
              rows={3}
              maxLength={500}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none text-sm resize-none"
            />
            <p className="text-xs text-gray-600 mt-1 text-right">{description.length}/500</p>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {GIG_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(category === cat.id ? "" : cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1.5 ${
                    category === cat.id
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Token */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Payment Token</label>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
              >
                USDC (devnet)
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Using devnet test USDC</p>
          </div>

          {/* Milestones */}
          <div>
            <label className="text-sm text-gray-400 block mb-3">Milestones * (up to 10)</label>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMilestone(i, "name", e.target.value)}
                      placeholder="Milestone name"
                      className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 pl-10 sm:pl-0">
                    <div className="relative w-full sm:w-32">
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                        placeholder="Amount"
                        min="0"
                        step="0.01"
                        className="w-full p-2.5 pr-14 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{token}</span>
                    </div>
                    {milestones.length > 1 && (
                      <button onClick={() => removeMilestone(i)} className="text-gray-500 hover:text-red-400 transition p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            {milestones.length < 10 && (
              <button onClick={addMilestone}
                className="mt-3 flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition">
                <Plus className="w-4 h-4" /> Add milestone
              </button>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Deadline *</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {/* AI Risk Assessment */}
          {totalBudget > 0 && deadline && (
            <RiskIndicator
              budget={totalBudget}
              milestones={milestones.length}
              deadline={deadline}
            />
          )}

          {/* Summary */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Budget</span>
              <span className="text-2xl font-bold text-emerald-400">{totalBudget.toFixed(2)} {token}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-gray-500">Milestones</span>
              <span className="text-gray-400">{milestones.filter((m) => m.amount).length} of {milestones.length}</span>
            </div>
          </div>

          {/* Create */}
          <button
            onClick={handleCreate}
            disabled={creating || !title || milestones.some((m) => !m.name || !m.amount) || !deadline || totalBudget <= 0}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-black font-semibold transition flex items-center justify-center gap-2"
          >
            {creating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creating & Funding Escrow...</>
            ) : (
              <><Shield className="w-5 h-5" /> Create Gig & Lock {totalBudget.toFixed(2)} {token}</>
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Funds will be locked in a non-custodial PDA escrow on Solana. You can cancel for a full refund before a freelancer accepts.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
