"use client";

import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/components/Toast";

interface TxOptions {
  loadingMessage?: string;
  successMessage?: string;
  onSuccess?: (signature: string) => void;
}

/**
 * Hook for safe transaction execution with:
 * - Wallet connection check
 * - Loading toast
 * - Confirmation wait
 * - Error handling
 * - Explorer link
 */
export function useTransaction() {
  const { connected } = useWallet();
  const { connection } = useConnection();
  const toast = useToast();

  const execute = useCallback(
    async (
      txFn: () => Promise<string>,
      options: TxOptions = {}
    ): Promise<string | null> => {
      const {
        loadingMessage = "Processing transaction...",
        successMessage = "Transaction confirmed!",
        onSuccess,
      } = options;

      if (!connected) {
        toast.error("Wallet not connected. Please connect your wallet.");
        return null;
      }

      const loadingId = toast.loading(loadingMessage);

      try {
        const signature = await txFn();

        // Wait for confirmation
        toast.dismiss(loadingId);
        const confirmId = toast.loading("Confirming on-chain...");

        try {
          await connection.confirmTransaction(signature, "confirmed");
          toast.dismiss(confirmId);
        } catch {
          toast.dismiss(confirmId);
          // Transaction may still have succeeded
        }

        toast.success(successMessage, {
          action: {
            label: "Explorer",
            onClick: () =>
              window.open(
                `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
                "_blank"
              ),
          },
        });

        onSuccess?.(signature);
        return signature;
      } catch (err: unknown) {
        toast.dismiss(loadingId);

        const message =
          err instanceof Error ? err.message : "Transaction failed";

        // Handle common errors
        if (message.includes("User rejected")) {
          toast.error("Transaction cancelled by user");
        } else if (message.includes("Blockhash not found")) {
          toast.error("Transaction expired. Please try again.");
        } else if (
          message.includes("insufficient") ||
          message.includes("Insufficient")
        ) {
          toast.error(
            "Insufficient balance. Get tokens from the Faucet page."
          );
        } else if (message.includes("disconnected")) {
          toast.error("Wallet disconnected. Please reconnect.");
        } else {
          toast.error(`Error: ${message.slice(0, 120)}`);
        }

        return null;
      }
    },
    [connected, connection, toast]
  );

  return { execute };
}
