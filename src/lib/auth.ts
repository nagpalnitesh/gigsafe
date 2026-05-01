/**
 * Wallet signature verification for API routes.
 * 
 * Client signs a message with their Solana wallet,
 * server verifies the signature matches the claimed wallet.
 * 
 * Message format: "GigSafe:<action>:<timestamp>"
 */

import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

const SIGNATURE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify a Solana wallet signature.
 */
export function verifySignature(
  walletAddress: string,
  message: string,
  signature: string
): { valid: boolean; error?: string } {
  try {
    // Validate wallet address
    const publicKey = new PublicKey(walletAddress);
    if (!PublicKey.isOnCurve(publicKey)) {
      return { valid: false, error: "Invalid wallet address" };
    }

    // Check timestamp in message
    const parts = message.split(":");
    const timestamp = parseInt(parts[parts.length - 1]);
    if (isNaN(timestamp)) {
      return { valid: false, error: "Invalid message format" };
    }

    const age = Math.abs(Date.now() - timestamp);
    if (age > SIGNATURE_WINDOW_MS) {
      return { valid: false, error: "Signature expired" };
    }

    // Verify signature
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = publicKey.toBytes();

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: "Verification failed" };
  }
}

/**
 * Extract and verify auth from request headers.
 * Headers: x-wallet, x-signature, x-message
 * 
 * Returns wallet address if valid, null if not.
 * For now, auth is optional — we verify if headers are present.
 */
export function getAuthenticatedWallet(req: Request): string | null {
  const wallet = req.headers.get("x-wallet");
  const signature = req.headers.get("x-signature");
  const message = req.headers.get("x-message");

  if (!wallet || !signature || !message) {
    return null; // No auth headers — anonymous request
  }

  const result = verifySignature(wallet, message, signature);
  return result.valid ? wallet : null;
}

/**
 * Validate that a string looks like a valid Solana public key.
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
