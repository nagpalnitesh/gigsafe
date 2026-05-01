import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idlJson from "./idl/gigsafe_protocol.json";
import { GIGSAFE_PROGRAM_ID, TOKEN_DECIMALS } from "./constants";

// Re-export IDL
export const IDL = idlJson as Idl;

// GigStatus enum matching on-chain values
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

// MilestoneStatus enum matching on-chain values
export enum MilestoneStatus {
  Pending = 0,
  Submitted = 1,
  Approved = 2,
}

export const MILESTONE_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Submitted",
  2: "Approved",
};

// Get Anchor Program instance
export function getProgram(wallet: AnchorWallet, connection: Connection): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(IDL, provider);
}

// Derive gig PDA
export function deriveGigPDA(clientPubkey: PublicKey, gigId: BN): [PublicKey, number] {
  const gigIdBuffer = Buffer.alloc(8);
  gigIdBuffer.writeBigUInt64LE(BigInt(gigId.toString()));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("gig"), clientPubkey.toBuffer(), gigIdBuffer],
    GIGSAFE_PROGRAM_ID
  );
}

// Derive escrow PDA
export function deriveEscrowPDA(gigPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), gigPda.toBuffer()],
    GIGSAFE_PROGRAM_ID
  );
}

// Convert human-readable amount to smallest units
export function toSmallestUnits(amount: number): BN {
  return new BN(Math.round(amount * Math.pow(10, TOKEN_DECIMALS)));
}

// Convert smallest units to human-readable
export function fromSmallestUnits(amount: BN): number {
  return amount.toNumber() / Math.pow(10, TOKEN_DECIMALS);
}

// Shorten public key for display
export function shortenKey(key: string): string {
  if (key.length < 8) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

// GigAccount type
export interface GigAccountData {
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
  milestoneStatuses: Buffer;
  deadline: BN;
  createdAt: BN;
  gigId: BN;
  escrowBump: number;
  bump: number;
}

// Fetch all gigs from chain
export async function fetchAllGigs(
  program: Program
): Promise<{ publicKey: PublicKey; account: GigAccountData }[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gigs = await (program.account as any).gigAccount.all();
  return gigs;
}

// Fetch a single gig by PDA
export async function fetchGig(
  program: Program,
  gigPda: PublicKey
): Promise<GigAccountData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gig = await (program.account as any).gigAccount.fetch(gigPda);
  return gig as GigAccountData;
}

// Instruction: createGig
export async function createGig(
  program: Program,
  gigId: BN,
  title: string,
  milestoneAmounts: BN[],
  deadline: BN,
  tokenMint: PublicKey
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .createGig(gigId, title, milestoneAmounts, deadline)
    .accounts({
      tokenMint,
    })
    .rpc();
  return tx;
}

// Instruction: fundGig
export async function fundGig(
  program: Program,
  gigId: BN
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .fundGig(gigId)
    .rpc();
  return tx;
}

// Instruction: acceptGig
export async function acceptGig(
  program: Program,
  gigId: BN
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .acceptGig(gigId)
    .rpc();
  return tx;
}

// Instruction: submitMilestone
export async function submitMilestone(
  program: Program,
  gigId: BN,
  milestoneIndex: number
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .submitMilestone(gigId, milestoneIndex)
    .rpc();
  return tx;
}

// Instruction: approveMilestone
export async function approveMilestone(
  program: Program,
  clientKey: PublicKey,
  gigId: BN,
  milestoneIndex: number,
  freelancerWallet: PublicKey,
  tokenMint: PublicKey
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .approveMilestone(clientKey, gigId, milestoneIndex)
    .accounts({
      freelancerWallet,
      tokenMint,
    })
    .rpc();
  return tx;
}

// Instruction: requestDispute
export async function requestDispute(
  program: Program,
  gigId: BN
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .requestDispute(gigId)
    .rpc();
  return tx;
}

// Instruction: resolveDispute
export async function resolveDispute(
  program: Program,
  clientKey: PublicKey,
  gigId: BN,
  freelancerBps: number,
  freelancerWallet: PublicKey,
  clientWallet: PublicKey,
  tokenMint: PublicKey
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .resolveDispute(clientKey, gigId, freelancerBps)
    .accounts({
      freelancerWallet,
      clientWallet,
      tokenMint,
    })
    .rpc();
  return tx;
}

// Instruction: cancelGig
export async function cancelGig(
  program: Program,
  clientKey: PublicKey,
  gigId: BN,
  tokenMint: PublicKey
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .cancelGig(clientKey, gigId)
    .accounts({
      tokenMint,
    })
    .rpc();
  return tx;
}
