"use client";

import { AnimatePresence, motion } from "framer-motion";

type ToastProps = {
  open: boolean;
  tone?: "success" | "error" | "info" | "warning";
  message: string;
  onClose?: () => void;
};

const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-[#e8e4dc] bg-white text-[var(--color-text-primary)]",
};

export default function Toast({ open, tone = "info", message, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`animate-toast-in fixed bottom-4 left-1/2 z-[80] w-[min(92vw,420px)] -translate-x-1/2 rounded-xl border px-4 py-3 shadow-brand-medium ${toneClasses[tone]}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{message}</p>
            {onClose ? (
              <button type="button" onClick={onClose} className="rounded-md px-1.5 py-0.5 text-xs font-semibold hover:bg-black/5">
                Dismiss
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
