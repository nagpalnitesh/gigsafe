/**
 * Authenticated fetch hook — signs requests with wallet.
 * Falls back to unsigned requests if wallet isn't connected.
 */

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

export function useAuthFetch() {
  const { publicKey, signMessage } = useWallet();

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);

      // If wallet connected and signMessage available, add auth headers
      if (publicKey && signMessage) {
        try {
          const timestamp = Date.now();
          const message = `GigSafe:api:${timestamp}`;
          const messageBytes = new TextEncoder().encode(message);
          const signature = await signMessage(messageBytes);

          headers.set("x-wallet", publicKey.toString());
          headers.set("x-message", message);
          headers.set("x-signature", bs58.encode(signature));
        } catch {
          // User rejected signing — proceed without auth
        }
      }

      return fetch(url, { ...options, headers });
    },
    [publicKey, signMessage]
  );

  return authFetch;
}
