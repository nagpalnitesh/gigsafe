import { PublicKey } from "@solana/web3.js";

/** GigSafe program ID on Solana */
export const GIGSAFE_PROGRAM_ID = new PublicKey(
  "2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4"
);

/** Default RPC endpoint (devnet) */
export const DEFAULT_RPC_ENDPOINT = "https://api.devnet.solana.com";

/** Default token decimals (USDC = 6) */
export const DEFAULT_TOKEN_DECIMALS = 6;

/** Devnet USDC mint */
export const DEVNET_USDC_MINT = new PublicKey(
  "5ZpAiCXV9kgRm5Sa8755cJ9YYwuJtgZdZEKY1a5zPyYV"
);
