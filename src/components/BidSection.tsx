"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { DollarSign, Send, Loader2, Check, X, MessageSquare } from "lucide-react";
import { useToast } from "@/components/Toast";
import { UserBadge } from "@/components/UserBadge";
import { notify } from "@/lib/notify";

interface Bid {
  id: number;
  gigPda: string;
  bidder: string;
  amount: number;
  message: string | null;
  status: string;
  createdAt: number;
}

interface BidSectionProps {
  gigPda: string;
  gigTitle: string;
  clientWallet: string;
  totalBudget: number;
  isOpen: boolean;
  isFunded: boolean;
}

export function BidSection({
  gigPda, gigTitle, clientWallet, totalBudget, isOpen, isFunded,
}: BidSectionProps) {
  const { publicKey } = useWallet();
  const toast = useToast();

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const wallet = publicKey?.toString() ?? "";
  const isClient = wallet === clientWallet;
  const myBid = bids.find((b) => b.bidder === wallet);
  const pendingBids = bids.filter((b) => b.status === "pending");

  useEffect(() => {
    fetch(`/api/bids?gigPda=${encodeURIComponent(gigPda)}`)
      .then((r) => r.json())
      .then(setBids)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gigPda]);

  const handleSubmitBid = async () => {
    if (!bidAmount || !wallet) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigPda, bidder: wallet,
          amount: bidAmount, message: bidMessage.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Bid submitted!");
        notify.gigAccepted(clientWallet, gigPda, `New bid on "${gigTitle}"`);
        // Refresh bids
        const updated = await fetch(`/api/bids?gigPda=${encodeURIComponent(gigPda)}`).then((r) => r.json());
        setBids(updated);
        setBidAmount("");
        setBidMessage("");
      }
    } catch {
      toast.error("Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBidAction = async (bidder: string, status: "accepted" | "rejected") => {
    try {
      await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", gigPda, bidder, status }),
      });
      toast.success(`Bid ${status}!`);
      const updated = await fetch(`/api/bids?gigPda=${encodeURIComponent(gigPda)}`).then((r) => r.json());
      setBids(updated);
    } catch {
      toast.error("Failed to update bid");
    }
  };

  if (!isOpen || !isFunded) return null;

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        Bids
        {pendingBids.length > 0 && (
          <span className="text-xs text-gray-500">({pendingBids.length} pending)</span>
        )}
      </h3>

      {/* Bid list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <AnimatePresence>
            {bids.map((bid) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border ${
                  bid.status === "accepted"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : bid.status === "rejected"
                    ? "bg-red-500/5 border-red-500/10 opacity-50"
                    : "bg-white/[0.02] border-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <UserBadge wallet={bid.bidder} size="sm" />
                    <span className="text-sm font-bold text-emerald-400">
                      {bid.amount.toFixed(2)} USDC
                    </span>
                    {bid.amount < totalBudget && (
                      <span className="text-[10px] text-gray-600">
                        ({((1 - bid.amount / totalBudget) * 100).toFixed(0)}% below budget)
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      bid.status === "accepted" ? "bg-emerald-500/20 text-emerald-400" :
                      bid.status === "rejected" ? "bg-red-500/20 text-red-400" :
                      bid.status === "withdrawn" ? "bg-gray-500/20 text-gray-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {bid.status}
                    </span>
                  </div>

                  {/* Client can accept/reject pending bids */}
                  {isClient && bid.status === "pending" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleBidAction(bid.bidder, "accepted")}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                        title="Accept bid"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleBidAction(bid.bidder, "rejected")}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                        title="Reject bid"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {bid.message && (
                  <div className="flex items-start gap-1.5 mt-2 pl-6">
                    <MessageSquare className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-400">{bid.message}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {bids.length === 0 && !loading && (
            <p className="text-sm text-gray-600 text-center py-3">No bids yet</p>
          )}
        </div>
      )}

      {/* Submit bid form (for non-clients who haven't bid yet) */}
      {!isClient && wallet && !myBid && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-sm font-medium mb-3">Place a bid</h4>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Budget: ${totalBudget.toFixed(2)} USDC`}
                min="0"
                step="0.01"
                className="w-full pl-9 pr-14 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">USDC</span>
            </div>
            <button
              onClick={handleSubmitBid}
              disabled={submitting || !bidAmount}
              className="px-4 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition disabled:opacity-30 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Bid
            </button>
          </div>
          <textarea
            value={bidMessage}
            onChange={(e) => setBidMessage(e.target.value)}
            placeholder="Why should the client pick you? (optional)"
            rows={2}
            maxLength={500}
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none resize-none"
          />
        </div>
      )}

      {/* Show existing bid */}
      {!isClient && myBid && myBid.status === "pending" && (
        <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-sm text-yellow-400">
          ⏳ Your bid of {myBid.amount.toFixed(2)} USDC is pending
        </div>
      )}
      {!isClient && myBid && myBid.status === "accepted" && (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm text-emerald-400">
          ✅ Your bid was accepted! Accept the gig above to start working.
        </div>
      )}
    </div>
  );
}
