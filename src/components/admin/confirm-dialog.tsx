"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const shouldReduceMotion = useReducedMotionPreference();

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  const variantStyles = {
    danger: {
      icon: "warning",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      buttonVariant: "primary" as const,
    },
    warning: {
      icon: "info",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      buttonVariant: "primary" as const,
    },
    info: {
      icon: "help",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      buttonVariant: "primary" as const,
    },
  };

  const style = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }
            }
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, scale: 0.95, y: 20 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? undefined
                : { opacity: 0, scale: 0.95, y: 20 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
            className="fixed left-1/2 top-1/2 z-[80] w-[min(92vw,28rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e8e4dc] bg-white shadow-2xl lg:left-[calc(50%+140px)]"
          >
            <div className="p-6">
              {/* Icon */}
              <div
                className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${style.iconBg}`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${style.iconColor}`}
                >
                  {style.icon}
                </span>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="mb-2 font-display text-xl font-semibold text-[#1a1f2e]">
                  {title}
                </h3>
                <p className="text-sm text-[#6b7280]">{message}</p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  variant={style.buttonVariant}
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Processing..." : confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
