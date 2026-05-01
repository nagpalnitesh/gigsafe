"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, X } from "lucide-react";

export type ToastType = "success" | "error" | "loading";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, action?: ToastAction) => string;
  removeToast: (id: string) => void;
  success: (message: string, opts?: { action?: ToastAction }) => string;
  error: (message: string) => string;
  loading: (message: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback((type: ToastType, message: string, action?: ToastAction): string => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message, action }]);

    // Auto-dismiss after 6s for non-loading toasts
    if (type !== "loading") {
      const timer = setTimeout(() => removeToast(id), 6000);
      timers.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const success = useCallback((message: string, opts?: { action?: ToastAction }) => addToast("success", message, opts?.action), [addToast]);
  const error = useCallback((message: string) => addToast("error", message), [addToast]);
  const loading = useCallback((message: string) => addToast("loading", message), [addToast]);
  const dismiss = removeToast;

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, loading, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, removeToast } = ctx;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100"
                : toast.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-100"
                : "bg-gray-800/90 border-white/10 text-gray-100"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === "error" && <XCircle className="w-5 h-5 text-red-400" />}
              {toast.type === "loading" && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
                  className="mt-1.5 text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition"
                >
                  {toast.action.label} →
                </button>
              )}
            </div>
            {toast.type !== "loading" && (
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-gray-500 hover:text-gray-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
