/**
 * Environment-based configuration.
 * Supports devnet and mainnet-beta via NEXT_PUBLIC_NETWORK env var.
 */

import { PublicKey } from "@solana/web3.js";

export type Network = "devnet" | "mainnet-beta";

export const NETWORK: Network = 
  (process.env.NEXT_PUBLIC_NETWORK as Network) || "devnet";

interface NetworkConfig {
  rpcEndpoint: string;
  programId: PublicKey;
  usdcMint: PublicKey;
  tokenDecimals: number;
  explorerBase: string;
  label: string;
  badge: string;
}

const configs: Record<Network, NetworkConfig> = {
  devnet: {
    rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com",
    programId: new PublicKey("2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4"),
    usdcMint: new PublicKey("AM1TfNi6rFnGH2evzyxV7eCu1LnJRdrYDG9kq3mhpXhf"),
    tokenDecimals: 6,
    explorerBase: "https://explorer.solana.com",
    label: "Devnet",
    badge: "DEVNET",
  },
  "mainnet-beta": {
    rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com",
    programId: new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4"),
    // Real USDC on mainnet
    usdcMint: new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    tokenDecimals: 6,
    explorerBase: "https://explorer.solana.com",
    label: "Mainnet",
    badge: "MAINNET",
  },
};

export const config = configs[NETWORK];

/**
 * Get explorer URL for a transaction or address.
 */
export function explorerUrl(type: "tx" | "address", value: string): string {
  const cluster = NETWORK === "devnet" ? "?cluster=devnet" : "";
  return `${config.explorerBase}/${type}/${value}${cluster}`;
}

/**
 * Is this devnet?
 */
export function isDevnet(): boolean {
  return NETWORK === "devnet";
}
