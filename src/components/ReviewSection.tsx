"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Send } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/components/Toast";
import {
  submitReview,
  fetchReputation,
  fetchHasReviewed,
  Review,
  WalletReputation,
  getReputation,
} from "@/lib/reputation";
import { shortenKey } from "@/lib/program";
import { notify } from "@/lib/notify";

function StarRating({
  rating,
  onRate,
  interactive = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`${interactive ? "cursor-pointer" : "cursor-default"} transition`}
        >
          <Star
            className={`w-4 h-4 ${
              star <= (hover || rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Compact reputation badge for displaying next to wallet addresses.
 */
export function ReputationBadge({ wallet }: { wallet: string }) {
  const [rep, setRep] = useState<WalletReputation | null>(null);

  useEffect(() => {
    fetchReputation(wallet).then(setRep);
  }, [wallet]);

  if (!rep || rep.totalGigs === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
      <Star className="w-3 h-3 fill-yellow-400" />
      {rep.averageRating.toFixed(1)}
      <span className="text-gray-600">({rep.totalGigs})</span>
    </span>
  );
}

/**
 * Full review section for completed/resolved gigs.
 */
export function ReviewSection({
  gigPda,
  gigTitle,
  clientWallet,
  freelancerWallet,
  isCompleted,
}: {
  gigPda: string;
  gigTitle: string;
  clientWallet: string;
  freelancerWallet: string;
  isCompleted: boolean;
}) {
  const { publicKey } = useWallet();
  const toast = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [clientRep, setClientRep] = useState<WalletReputation | null>(null);
  const [freelancerRep, setFreelancerRep] = useState<WalletReputation | null>(null);

  const myAddress = publicKey?.toString() ?? "";
  const isClient = myAddress === clientWallet;
  const isFreelancer = myAddress === freelancerWallet;
  const canReview = isCompleted && (isClient || isFreelancer);

  // Who am I reviewing?
  const reviewTarget = isClient ? freelancerWallet : clientWallet;
  const reviewTargetLabel = isClient ? "Freelancer" : "Client";

  useEffect(() => {
    fetchReputation(clientWallet).then(setClientRep);
    fetchReputation(freelancerWallet).then(setFreelancerRep);
    if (publicKey && reviewTarget) {
      fetchHasReviewed(reviewTarget, gigPda, myAddress).then(setSubmitted);
    }
  }, [clientWallet, freelancerWallet, publicKey, gigPda, myAddress, reviewTarget]);

  const handleSubmit = () => {
    if (!rating || !publicKey) return;

    const review: Review = {
      gigPda,
      gigTitle,
      reviewer: myAddress,
      reviewerRole: isClient ? "client" : "freelancer",
      rating,
      comment: comment.trim(),
      timestamp: Date.now(),
    };

    submitReview(reviewTarget, review);
    setSubmitted(true);

    // Refresh reputation
    fetchReputation(clientWallet).then(setClientRep);
    fetchReputation(freelancerWallet).then(setFreelancerRep);

    toast.success(`Review submitted for ${shortenKey(reviewTarget)}!`);

    // Notify the reviewed party
    notify.reviewReceived(reviewTarget, gigPda, gigTitle, rating);
  };

  return (
    <div className="space-y-4">
      {/* Reputation display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-xs text-gray-500 mb-1">Client</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{shortenKey(clientWallet)}</span>
            {clientRep && clientRep.totalGigs > 0 && (
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(clientRep.averageRating)} />
                <span className="text-xs text-gray-500">({clientRep.totalGigs})</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-xs text-gray-500 mb-1">Freelancer</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{shortenKey(freelancerWallet)}</span>
            {freelancerRep && freelancerRep.totalGigs > 0 && (
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(freelancerRep.averageRating)} />
                <span className="text-xs text-gray-500">({freelancerRep.totalGigs})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave a review */}
      {canReview && !submitted && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
        >
          <h4 className="text-sm font-semibold mb-3">
            Rate the {reviewTargetLabel}
          </h4>
          <div className="mb-3">
            <StarRating rating={rating} onRate={setRating} interactive />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: share your experience..."
            rows={2}
            maxLength={200}
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none resize-none mb-3"
          />
          <button
            onClick={handleSubmit}
            disabled={!rating}
            className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 disabled:bg-gray-800 disabled:cursor-not-allowed border border-yellow-500/30 text-yellow-400 text-sm font-medium transition flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" /> Submit Review
          </button>
        </motion.div>
      )}

      {canReview && submitted && (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm text-emerald-400">
          ✓ You&apos;ve reviewed this {reviewTargetLabel.toLowerCase()}
        </div>
      )}
    </div>
  );
}
