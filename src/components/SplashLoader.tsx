"use client";

import { motion } from "framer-motion";

/**
 * Full-page splash loader shown during initial app hydration.
 */
export function SplashLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#030712] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <motion.img
          src="/android-chrome-192x192.png"
          alt="GigSafe"
          width={64}
          height={64}
          className="rounded-2xl mb-6"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex items-center gap-2 font-bold text-2xl mb-2">
          Gig<span className="text-emerald-400">Safe</span>
        </div>
        <p className="text-sm text-gray-500 mb-8">Loading on-chain data...</p>

        {/* Animated dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
