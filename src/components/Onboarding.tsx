"use client";

import { motion } from "framer-motion";
import { Shield, Coins, Bot, Zap, ArrowRight } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const steps = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Connect Wallet",
    desc: "Use Phantom or Solflare. Make sure you're on Devnet.",
  },
  {
    icon: <Coins className="w-6 h-6" />,
    title: "Post or Accept a Gig",
    desc: "Clients fund escrow. Freelancers browse and accept work.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Deliver & Get Paid",
    desc: "Submit milestones, get approved, receive USDC instantly.",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "Disputes? AI Handles It",
    desc: "Fair resolution in minutes, not weeks.",
  },
];

export function Onboarding() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <img
          src="/android-chrome-192x192.png"
          alt="GigSafe"
          width={56}
          height={56}
          className="rounded-2xl mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold mb-2">
          Welcome to Gig<span className="text-emerald-400">Safe</span>
        </h1>
        <p className="text-gray-400">
          Trustless freelance escrow on Solana. Here&apos;s how to get started.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-emerald-400 font-bold">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-sm">{step.title}</h3>
              </div>
              <p className="text-xs text-gray-500">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-xl !h-12 !text-base !text-black !font-semibold !px-8" />
        <p className="text-xs text-gray-600 mt-4">
          New to Solana?{" "}
          <a
            href="https://phantom.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            Get Phantom wallet →
          </a>
        </p>
      </motion.div>
    </div>
  );
}
