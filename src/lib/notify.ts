/**
 * Send notifications to users after on-chain events.
 */

type NotifType =
  | "gig_created"
  | "gig_accepted"
  | "milestone_submitted"
  | "milestone_approved"
  | "dispute_raised"
  | "dispute_resolved"
  | "gig_cancelled"
  | "review_received";

async function send(wallet: string, type: NotifType, title: string, message: string, gigPda?: string, gigTitle?: string) {
  try {
    // Send notification
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, type, title, message, gigPda, gigTitle }),
    });
    // Log to activity feed
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, description: message, gigPda, gigTitle, actor: wallet }),
    });
  } catch {
    // Silently fail — notifications are best-effort
  }
}

export const notify = {
  /** Notify freelancer that a new gig is available (or client that their gig was created) */
  gigCreated(clientWallet: string, gigPda: string, gigTitle: string) {
    send(clientWallet, "gig_created", "Gig Created", `Your gig "${gigTitle}" is live and funded.`, gigPda, gigTitle);
  },

  /** Notify client that their gig was accepted */
  gigAccepted(clientWallet: string, gigPda: string, gigTitle: string) {
    send(clientWallet, "gig_accepted", "Gig Accepted! 🎉", `A freelancer accepted your gig "${gigTitle}".`, gigPda, gigTitle);
  },

  /** Notify client that a milestone was submitted */
  milestoneSubmitted(clientWallet: string, gigPda: string, gigTitle: string, milestoneIndex: number, milestoneName?: string) {
    const msName = milestoneName || `Milestone ${milestoneIndex + 1}`;
    send(clientWallet, "milestone_submitted", "Milestone Submitted", `${msName} submitted for review on "${gigTitle}".`, gigPda, gigTitle);
  },

  /** Notify freelancer that a milestone was approved & paid */
  milestoneApproved(freelancerWallet: string, gigPda: string, gigTitle: string, milestoneIndex: number, amount: string, milestoneName?: string) {
    const msName = milestoneName || `Milestone ${milestoneIndex + 1}`;
    send(freelancerWallet, "milestone_approved", "Milestone Approved! 💰", `${msName} approved on "${gigTitle}". ${amount} USDC sent to your wallet.`, gigPda, gigTitle);
  },

  /** Notify both parties of a dispute */
  disputeRaised(otherPartyWallet: string, gigPda: string, gigTitle: string) {
    send(otherPartyWallet, "dispute_raised", "Dispute Raised ⚠️", `A dispute has been raised on "${gigTitle}".`, gigPda, gigTitle);
  },

  /** Notify both parties of resolution */
  disputeResolved(wallet: string, gigPda: string, gigTitle: string, splitDesc: string) {
    send(wallet, "dispute_resolved", "Dispute Resolved", `"${gigTitle}" dispute resolved: ${splitDesc}`, gigPda, gigTitle);
  },

  /** Notify client of cancellation confirmation */
  gigCancelled(clientWallet: string, gigPda: string, gigTitle: string) {
    send(clientWallet, "gig_cancelled", "Gig Cancelled", `"${gigTitle}" has been cancelled. Funds refunded.`, gigPda, gigTitle);
  },

  /** Notify user they received a review */
  reviewReceived(wallet: string, gigPda: string, gigTitle: string, rating: number) {
    send(wallet, "review_received", "New Review ⭐", `You received a ${rating}-star review on "${gigTitle}".`, gigPda, gigTitle);
  },
};
