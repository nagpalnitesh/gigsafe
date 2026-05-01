"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { UserBadge } from "@/components/UserBadge";

interface ChatMessage {
  id: string;
  gigPda: string;
  sender: string;
  message: string;
  timestamp: number;
}

interface GigChatProps {
  gigPda: string;
  clientWallet: string;
  freelancerWallet: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;

  if (diff < 86400000) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString([], { weekday: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function GigChat({ gigPda, clientWallet, freelancerWallet }: GigChatProps) {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const wallet = publicKey?.toString() ?? "";
  const isParty = wallet === clientWallet || wallet === freelancerWallet;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?gigPda=${encodeURIComponent(gigPda)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {}
  }, [gigPda]);

  // Initial load
  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
  }, [expanded, fetchMessages]);

  // Poll for new messages when expanded
  useEffect(() => {
    if (!expanded) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [expanded, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, expanded]);

  const handleSend = async () => {
    if (!newMessage.trim() || !wallet || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigPda, sender: wallet, message: newMessage.trim() }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        inputRef.current?.focus();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold">Chat</span>
          {messages.length > 0 && (
            <span className="text-xs text-gray-500">({messages.length})</span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Messages */}
            <div className="h-64 overflow-y-auto px-4 py-3 space-y-3 bg-[#030712]/50">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-600">
                  No messages yet. Start the conversation!
                </div>
              )}

              {messages.map((msg) => {
                const isMe = msg.sender === wallet;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                        isMe
                          ? "bg-emerald-500/20 border border-emerald-500/20"
                          : "bg-white/5 border border-white/5"
                      }`}
                    >
                      {!isMe && (
                        <div className="mb-0.5">
                          <UserBadge wallet={msg.sender} size="sm" link={false} showAvatar={false} />
                        </div>
                      )}
                      <p className="text-sm text-gray-200 leading-relaxed break-words">
                        {msg.message}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1 text-right">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {isParty ? (
              <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5 bg-white/[0.01]">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  maxLength={1000}
                  className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : (
              <div className="px-4 py-2.5 border-t border-white/5 text-xs text-gray-600 text-center">
                Only the client and freelancer can chat
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
