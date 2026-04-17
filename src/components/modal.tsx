"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showHeader?: boolean;
  footer?: React.ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, title, description, children, size = "lg", showHeader = true, footer }: ModalProps) {
  const shouldReduceMotion = useReducedMotionPreference();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) {
      return;
    }

    const panel = panelRef.current;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[100vw] h-[100vh] rounded-none"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
            onMouseDown={(event) => {
              if (event.target === overlayRef.current) {
                onClose();
              }
            }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container - Centered with scroll */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={panelRef}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={title || "Modal"}
              className={`relative w-full ${sizeClasses[size]} my-8`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex max-h-[calc(100dvh-4rem)] flex-col overflow-hidden border border-[#e8e4dc] bg-white shadow-2xl ${size === "full" ? "h-full max-h-full rounded-none" : "rounded-[24px]"}`}>
                {showHeader ? (
                  <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#ece7de] bg-[#f8f6f2]/95 px-6 py-4 backdrop-blur">
                    <div>
                      {title ? <h2 className="font-display text-2xl font-semibold text-[#1a1f2e]">{title}</h2> : null}
                      {description ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p> : null}
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-full p-2 transition hover:bg-[#efebe4]"
                      aria-label="Close"
                    >
                      <span className="material-symbols-outlined text-xl text-[#6b7280]">close</span>
                    </button>
                  </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                  {children}
                </div>

                {footer ? <div className="border-t border-[#ece7de] bg-[#fcfbf8] px-6 py-4">{footer}</div> : null}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
