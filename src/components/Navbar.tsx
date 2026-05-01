"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Wallet, LogOut, Copy, Check, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { NotificationBell } from "@/components/NotificationBell";
import { fetchProfile } from "@/lib/profile";

const links = [
  { href: "/gigs", label: "Browse Gigs" },
  { href: "/create", label: "Post a Gig" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/faucet", label: "Faucet" },
];

export function Navbar() {
  const pathname = usePathname();
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicKey) { setBalance(null); return; }
    const fetch = async () => {
      try { setBalance((await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL); } catch {}
    };
    fetch();
    const i = setInterval(fetch, 15000);
    return () => clearInterval(i);
  }, [publicKey, connected, connection]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobile(false);
  }, [pathname]);

  const shortAddr = publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : "";
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) { setDisplayName(null); return; }
    fetchProfile(publicKey.toString()).then((p) => {
      setDisplayName(p.displayName || null);
    }).catch(() => {});
  }, [publicKey]);

  const short = displayName || shortAddr;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo + desktop nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Image src="/favicon-32x32.png" alt="GigSafe" width={24} height={24} className="rounded-sm" />
            <span>Gig<span className="text-emerald-400">Safe</span></span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">DEVNET</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  pathname === link.href ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >{link.label}</Link>
            ))}
          </div>
        </div>

        {/* Right: wallet + hamburger */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          {connected && <NotificationBell />}

          {/* Wallet (desktop) */}
          {connected && publicKey ? (
            <div className="relative hidden sm:block" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">{short}</span>
                {balance !== null && <span className="hidden lg:inline text-sm text-gray-400">{balance.toFixed(2)} SOL</span>}
              </button>
              {showMenu && (
                <div className="absolute right-0 top-12 w-64 rounded-xl bg-[#0a0e18] border border-white/10 shadow-2xl z-50 p-3 space-y-2">
                  <button onClick={() => { navigator.clipboard.writeText(publicKey.toString()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-400 hover:bg-white/10">
                    <code className="flex-1 text-left truncate">{publicKey.toString()}</code>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <div className="px-3 py-2 text-sm">
                    <span className="text-gray-500">Balance:</span> <span className="font-bold">{balance?.toFixed(4)} SOL</span>
                    <div className="text-xs text-gray-600 mt-1">Devnet</div>
                  </div>
                  <button onClick={() => { disconnect(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4" /> Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:block">
              <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-lg !h-9 !text-sm !text-black" />
            </div>
          )}

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setShowMobile(!showMobile)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Toggle menu"
          >
            {showMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobile && (
        <div className="md:hidden border-t border-white/5 bg-[#030712]/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href}
                className={`block px-4 py-3 rounded-xl text-sm transition ${
                  pathname === link.href
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >{link.label}</Link>
            ))}

            {/* Wallet section in mobile menu */}
            <div className="pt-3 border-t border-white/5">
              {connected && publicKey ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">{short}</span>
                    {balance !== null && <span className="text-sm text-gray-400">{balance.toFixed(2)} SOL</span>}
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(publicKey.toString()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/5"
                  >
                    <code className="truncate flex-1 text-left">{publicKey.toString()}</code>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => { disconnect(); setShowMobile(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4" /> Disconnect
                  </button>
                </div>
              ) : (
                <div className="px-4 py-2">
                  <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-lg !h-10 !text-sm !text-black !w-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
