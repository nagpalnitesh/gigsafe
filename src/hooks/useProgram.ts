"use client";

import { useMemo } from "react";
import { useWallet, useConnection, AnchorWallet } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import { getProgram } from "@/lib/program";

export function useProgram(): Program | null {
  const { wallet, connected } = useWallet();
  const { connection } = useConnection();

  return useMemo(() => {
    if (!connected || !wallet?.adapter) return null;
    try {
      return getProgram(wallet.adapter as unknown as AnchorWallet, connection);
    } catch {
      return null;
    }
  }, [connected, wallet, connection]);
}
