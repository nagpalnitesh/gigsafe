"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Droplets, Loader2, CheckCircle2, ExternalLink, Coins } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function FaucetPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const toast = useToast();
  const [minting, setMinting] = useState(false);
  const [airdropping, setAirdropping] = useState(false);
  const [mintedAmount, setMintedAmount] = useState<number | null>(null);

  const handleMintUSDC = async () => {
    if (!publicKey) return;
    setMinting(true);
    setMintedAmount(null);
    const loadingId = toast.loading("Minting devnet USDC...");

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toString(), amount: 1000 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Mint failed");
      }

      const data = await res.json();
      toast.dismiss(loadingId);
      toast.success(`Minted ${data.amount} USDC to your wallet!`, {
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${data.signature}?cluster=devnet`,
              "_blank"
            ),
        },
      });
      setMintedAmount(data.amount);
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      toast.error(`Error: ${err instanceof Error ? err.message : "Mint failed"}`);
    } finally {
      setMinting(false);
    }
  };

  const handleAirdropSOL = async () => {
    if (!publicKey) return;
    setAirdropping(true);
    const loadingId = toast.loading("Requesting SOL airdrop...");

    try {
      const sig = await connection.requestAirdrop(publicKey, 2_000_000_000);
      await connection.confirmTransaction(sig, "confirmed");
      toast.dismiss(loadingId);
      toast.success("Airdropped 2 SOL!", {
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
              "_blank"
            ),
        },
      });
    } catch (err: unknown) {
      toast.dismiss(loadingId);
      const msg = err instanceof Error ? err.message : "Airdrop failed";
      if (msg.includes("airdrop")) {
        toast.error("Airdrop limit reached. Try again in a few minutes.");
      } else {
        toast.error(`Error: ${msg}`);
      }
    } finally {
      setAirdropping(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Droplets className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Devnet Faucet</h1>
        <p className="text-gray-400 mb-6">Connect your wallet to get test tokens</p>
        <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-lg !text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <Droplets className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-1">Devnet Faucet</h1>
          <p className="text-gray-400 text-sm">Get test tokens to try GigSafe</p>
        </div>

        <div className="space-y-4">
          {/* USDC Mint */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Devnet USDC</h3>
                <p className="text-xs text-gray-500">1,000 USDC per request</p>
              </div>
            </div>

            <button
              onClick={handleMintUSDC}
              disabled={minting}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-black font-semibold transition flex items-center justify-center gap-2"
            >
              {minting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Minting...</>
              ) : mintedAmount ? (
                <><CheckCircle2 className="w-5 h-5" /> Minted! Get More</>
              ) : (
                <><Droplets className="w-5 h-5" /> Mint 1,000 USDC</>
              )}
            </button>
          </div>

          {/* SOL Airdrop */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <span className="text-lg font-bold">◎</span>
              </div>
              <div>
                <h3 className="font-semibold">Devnet SOL</h3>
                <p className="text-xs text-gray-500">2 SOL per request (for tx fees)</p>
              </div>
            </div>

            <button
              onClick={handleAirdropSOL}
              disabled={airdropping}
              className="w-full py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-gray-800 disabled:cursor-not-allowed border border-purple-500/30 text-purple-400 font-semibold transition flex items-center justify-center gap-2"
            >
              {airdropping ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Airdropping...</>
              ) : (
                <><span className="text-lg">◎</span> Airdrop 2 SOL</>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-300">
            <strong>These are test tokens on Solana Devnet.</strong> They have no real value.
            Use them to create gigs, fund escrow, and test the full GigSafe workflow.
          </p>
        </div>

        <p className="text-xs text-gray-600 text-center mt-4">
          Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
        </p>
      </motion.div>
    </div>
  );
}
