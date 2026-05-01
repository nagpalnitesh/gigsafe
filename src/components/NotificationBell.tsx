"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  gigPda?: string;
  gigTitle?: string;
  read: boolean;
  createdAt: number;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const typeColors: Record<string, string> = {
  gig_accepted: "bg-blue-500",
  milestone_submitted: "bg-yellow-500",
  milestone_approved: "bg-emerald-500",
  dispute_raised: "bg-red-500",
  dispute_resolved: "bg-purple-500",
  gig_cancelled: "bg-gray-500",
  review_received: "bg-yellow-400",
  gig_created: "bg-emerald-400",
};

export function NotificationBell() {
  const { publicKey, connected } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const wallet = publicKey?.toString() ?? "";

  // Fetch unread count every 15 seconds
  useEffect(() => {
    if (!wallet) return;

    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/notifications?wallet=${encodeURIComponent(wallet)}&unread=true`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread ?? 0);
        }
      } catch {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [wallet]);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (!open || !wallet) return;

    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?wallet=${encodeURIComponent(wallet)}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch {}
    };

    fetchNotifs();
  }, [open, wallet]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    if (!wallet) return;
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", wallet }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  if (!connected) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-emerald-500 text-[10px] font-bold text-black flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.97 }}
            className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-80 max-h-96 overflow-y-auto rounded-xl bg-[#0a0e18] border border-white/10 shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.slice(0, 20).map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-white/[0.02] transition ${
                      !notif.read ? "bg-emerald-500/[0.03]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          typeColors[notif.type] ?? "bg-gray-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-600">
                            {timeAgo(notif.createdAt)}
                          </span>
                          {notif.gigPda && (
                            <Link
                              href={`/gig/${notif.gigPda}`}
                              onClick={() => setOpen(false)}
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              View gig <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
