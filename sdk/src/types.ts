import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// ============================================================
// Enums
// ============================================================

export enum GigStatus {
  Open = 0,
  Active = 1,
  Completed = 2,
  Disputed = 3,
  Resolved = 4,
  Cancelled = 5,
}

export const GIG_STATUS_LABELS: Record<number, string> = {
  0: "Open",
  1: "Active",
  2: "Completed",
  3: "Disputed",
  4: "Resolved",
  5: "Cancelled",
};

export enum MilestoneStatus {
  Pending = 0,
  Submitted = 1,
  Approved = 2,
  Disputed = 3,
}

export const MILESTONE_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Submitted",
  2: "Approved",
  3: "Disputed",
};

// ============================================================
// Account types
// ============================================================

export interface GigAccount {
  client: PublicKey;
  freelancer: PublicKey;
  tokenMint: PublicKey;
  title: string;
  totalBudget: BN;
  fundedAmount: BN;
  releasedAmount: BN;
  status: number;
  milestoneCount: number;
  milestoneAmounts: BN[];
  milestoneStatuses: number[];
  deadline: BN;
  createdAt: BN;
  gigId: BN;
  escrowBump: number;
  bump: number;
}

export interface GigEntry {
  publicKey: PublicKey;
  account: GigAccount;
}

// ============================================================
// Input types
// ============================================================

export interface CreateGigParams {
  /** Unique gig ID (use Date.now() or a UUID) */
  gigId: number | BN;
  /** Gig title (max 64 characters) */
  title: string;
  /** Amount per milestone in human-readable units (e.g., 100 for 100 USDC) */
  milestoneAmounts: number[];
  /** Deadline as Date object or unix timestamp (seconds) */
  deadline: Date | number;
  /** SPL token mint (e.g., USDC) */
  tokenMint: PublicKey;
}

export interface ResolveDisputeParams {
  /** Basis points for freelancer (0-10000). e.g., 7000 = 70% to freelancer */
  freelancerBps: number;
}

// ============================================================
// Config
// ============================================================

export interface GigSafeConfig {
  /** Solana RPC endpoint */
  rpcEndpoint?: string;
  /** Token decimals (default: 6 for USDC) */
  tokenDecimals?: number;
}
