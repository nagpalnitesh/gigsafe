/**
 * Re-exports from config for backward compatibility.
 * New code should import directly from @/lib/config.
 */

import { config } from "./config";

export const GIGSAFE_PROGRAM_ID = config.programId;
export const RPC_ENDPOINT = config.rpcEndpoint;
export const DEVNET_USDC = config.usdcMint;
export const TOKEN_DECIMALS = config.tokenDecimals;
