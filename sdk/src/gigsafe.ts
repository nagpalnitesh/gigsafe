import {
  Program,
  AnchorProvider,
  Idl,
  BN,
  Wallet,
} from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idlJson from "./idl.json";
import {
  GIGSAFE_PROGRAM_ID,
  DEFAULT_RPC_ENDPOINT,
  DEFAULT_TOKEN_DECIMALS,
} from "./constants";
import {
  GigAccount,
  GigEntry,
  CreateGigParams,
  ResolveDisputeParams,
  GigSafeConfig,
  GigStatus,
  GIG_STATUS_LABELS,
} from "./types";

/**
 * GigSafe SDK — Interact with the GigSafe protocol on Solana.
 *
 * @example
 * ```ts
 * import { GigSafe } from "@gigsafe/sdk";
 *
 * const gs = new GigSafe(wallet);
 * const tx = await gs.createGig({
 *   gigId: Date.now(),
 *   title: "Build a landing page",
 *   milestoneAmounts: [200, 300],
 *   deadline: new Date("2026-06-01"),
 *   tokenMint: DEVNET_USDC_MINT,
 * });
 * ```
 */
export class GigSafe {
  public readonly program: Program;
  public readonly connection: Connection;
  public readonly tokenDecimals: number;

  constructor(wallet: Wallet, config?: GigSafeConfig) {
    const endpoint = config?.rpcEndpoint ?? DEFAULT_RPC_ENDPOINT;
    this.connection = new Connection(endpoint, "confirmed");
    this.tokenDecimals = config?.tokenDecimals ?? DEFAULT_TOKEN_DECIMALS;

    const provider = new AnchorProvider(this.connection, wallet, {
      commitment: "confirmed",
    });

    this.program = new Program(idlJson as Idl, provider);
  }

  // ============================================================
  // PDA Derivation
  // ============================================================

  /**
   * Derive the gig PDA from client pubkey and gig ID.
   */
  deriveGigPDA(client: PublicKey, gigId: BN): [PublicKey, number] {
    const gigIdBuffer = Buffer.alloc(8);
    gigIdBuffer.writeBigUInt64LE(BigInt(gigId.toString()));
    return PublicKey.findProgramAddressSync(
      [Buffer.from("gig"), client.toBuffer(), gigIdBuffer],
      GIGSAFE_PROGRAM_ID
    );
  }

  /**
   * Derive the escrow PDA from a gig PDA.
   */
  deriveEscrowPDA(gigPda: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), gigPda.toBuffer()],
      GIGSAFE_PROGRAM_ID
    );
  }

  // ============================================================
  // Unit Conversion
  // ============================================================

  /**
   * Convert human-readable amount to smallest units.
   * e.g., 100 USDC → 100_000_000 (6 decimals)
   */
  toSmallestUnits(amount: number): BN {
    return new BN(Math.round(amount * Math.pow(10, this.tokenDecimals)));
  }

  /**
   * Convert smallest units to human-readable amount.
   */
  fromSmallestUnits(amount: BN): number {
    return amount.toNumber() / Math.pow(10, this.tokenDecimals);
  }

  // ============================================================
  // Instructions
  // ============================================================

  /**
   * Create a new gig with milestones.
   * @returns Transaction signature
   */
  async createGig(params: CreateGigParams): Promise<string> {
    const gigId =
      params.gigId instanceof BN ? params.gigId : new BN(params.gigId);
    const milestoneAmounts = params.milestoneAmounts.map((a) =>
      this.toSmallestUnits(a)
    );
    const deadline =
      params.deadline instanceof Date
        ? new BN(Math.floor(params.deadline.getTime() / 1000))
        : new BN(params.deadline);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = await (this.program.methods as any)
      .createGig(gigId, params.title, milestoneAmounts, deadline)
      .accounts({ tokenMint: params.tokenMint })
      .rpc();

    return tx;
  }

  /**
   * Fund a gig's escrow with the full budget.
   * @returns Transaction signature
   */
  async fundGig(gigId: number | BN): Promise<string> {
    const id = gigId instanceof BN ? gigId : new BN(gigId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.methods as any).fundGig(id).rpc();
  }

  /**
   * Create AND fund a gig in one call (2 transactions).
   * @returns Object with both transaction signatures and the gig PDA
   */
  async createAndFundGig(
    params: CreateGigParams
  ): Promise<{ createTx: string; fundTx: string; gigPda: PublicKey }> {
    const createTx = await this.createGig(params);
    const fundTx = await this.fundGig(params.gigId);

    const wallet = (this.program.provider as AnchorProvider).wallet;
    const gigId =
      params.gigId instanceof BN ? params.gigId : new BN(params.gigId);
    const [gigPda] = this.deriveGigPDA(wallet.publicKey, gigId);

    return { createTx, fundTx, gigPda };
  }

  /**
   * Accept a gig as a freelancer.
   * @returns Transaction signature
   */
  async acceptGig(gigId: number | BN): Promise<string> {
    const id = gigId instanceof BN ? gigId : new BN(gigId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.methods as any).acceptGig(id).rpc();
  }

  /**
   * Submit a milestone as complete (freelancer).
   * @returns Transaction signature
   */
  async submitMilestone(
    gigId: number | BN,
    milestoneIndex: number
  ): Promise<string> {
    const id = gigId instanceof BN ? gigId : new BN(gigId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.methods as any)
      .submitMilestone(id, milestoneIndex)
      .rpc();
  }

  /**
   * Approve a milestone and release payment to freelancer (client).
   * @returns Transaction signature
   */
  async approveMilestone(
    clientKey: PublicKey,
    gigId: number | BN,
    milestoneIndex: number,
    freelancerWallet: PublicKey,
    tokenMint: PublicKey
  ): Promise<string> {
    const id = gigId instanceof BN ? gigId : new BN(gigId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.methods as any)
      .approveMilestone(clientKey, id, milestoneIndex)
      .accounts({ freelancerWallet, tokenMint })
      .rpc();
  }

  /**
   * Raise a dispute on an active gig (client or freelancer).
   * @returns Transaction signature
   */
  async requestDispute(gigId: number | BN): Promise<string> {
    const id = gigId instanceof BN ? gigId : new BN(gigId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.methods as any).requestDispute(id).rpc();
  }

  /**
   * Resolve a dispute by splitting remaining funds.
   * @param freelancerBps - Basis points for freelancer (0-10000)
   * @returns Transaction signature
   */
  async resolveDispute(
    clientKey: PublicKey,
    gigId: number | BN,
    freelancerBps: number,
    freelancerWallet: PublicKey,
    clientWallet: PublicKey,
    tokenMint: PublicKey
  ): Promise<string> {
    const id = gigId instanceof BN ? gigId : new BN(gigId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.methods as any)
      .resolveDispute(clientKey, id, freelancerBps)
      .accounts({ freelancerWallet, clientWallet, tokenMint })
      .rpc();
  }

  /**
   * Cancel a gig and refund (client, before freelancer accepts).
   * @returns Transaction signature
   */
  async cancelGig(
    clientKey: PublicKey,
    gigId: number | BN,
    tokenMint: PublicKey
  ): Promise<string> {
    const id = gigId instanceof BN ? gigId : new BN(gigId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.methods as any)
      .cancelGig(clientKey, id)
      .accounts({ tokenMint })
      .rpc();
  }

  // ============================================================
  // Queries
  // ============================================================

  /**
   * Fetch all gigs from the chain.
   */
  async fetchAllGigs(): Promise<GigEntry[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.account as any).gigAccount.all();
  }

  /**
   * Fetch a single gig by its PDA address.
   */
  async fetchGig(gigPda: PublicKey): Promise<GigAccount> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program.account as any).gigAccount.fetch(gigPda);
  }

  /**
   * Fetch all gigs where the given pubkey is the client.
   */
  async fetchGigsByClient(client: PublicKey): Promise<GigEntry[]> {
    const all = await this.fetchAllGigs();
    return all.filter((g) => g.account.client.equals(client));
  }

  /**
   * Fetch all gigs where the given pubkey is the freelancer.
   */
  async fetchGigsByFreelancer(freelancer: PublicKey): Promise<GigEntry[]> {
    const all = await this.fetchAllGigs();
    return all.filter((g) => g.account.freelancer.equals(freelancer));
  }

  // ============================================================
  // Helpers
  // ============================================================

  /**
   * Get human-readable status label for a gig status number.
   */
  getStatusLabel(status: number): string {
    return GIG_STATUS_LABELS[status] ?? "Unknown";
  }

  /**
   * Check if a gig is in a specific status.
   */
  isStatus(gig: GigAccount, status: GigStatus): boolean {
    return gig.status === status;
  }

  /**
   * Get the number of approved milestones for a gig.
   */
  getApprovedCount(gig: GigAccount): number {
    return gig.milestoneStatuses.filter((s) => s === 2).length;
  }

  /**
   * Get remaining escrowed amount in human-readable units.
   */
  getRemainingAmount(gig: GigAccount): number {
    const remaining = gig.fundedAmount.sub(gig.releasedAmount);
    return this.fromSmallestUnits(remaining);
  }

  /**
   * Shorten a public key for display.
   */
  static shortenKey(key: PublicKey | string): string {
    const s = typeof key === "string" ? key : key.toString();
    if (s.length < 8) return s;
    return `${s.slice(0, 4)}...${s.slice(-4)}`;
  }
}
