"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SERVICE_ICON_THEME, SERVICE_MOTION_TOKENS } from "@/lib/theme-constants";
import type { Service } from "@/lib/supabase-queries";
import { getServiceIconFromRecord, getServiceSummary } from "@/lib/service-format";

interface ServiceDetailModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceDetailModal({
  service,
  isOpen,
  onClose,
}: ServiceDetailModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(
        () => setIsAnimating(false),
        SERVICE_MOTION_TOKENS.modalExitDurationMs
      );
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && !isAnimating) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAnimating, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!service || (!isOpen && !isAnimating) || !portalTarget) return null;

  const icon = getServiceIconFromRecord(service);
  const shortDescription = getServiceSummary(service, "Service details are being updated.", 180);
  const detailedDescription =
    service.detailed_description ||
    service.card_description ||
    "Detailed information for this service is being updated.";
  const contactHref = `/contact?${new URLSearchParams({
    query_type: "services",
    service_type: service.title,
  }).toString()}#inquiry-form`;
  const transitionDurationMs = isOpen
    ? SERVICE_MOTION_TOKENS.modalEnterDurationMs
    : SERVICE_MOTION_TOKENS.modalExitDurationMs;
  const transitionStyle = {
    transitionDuration: `${transitionDurationMs}ms`,
    transitionTimingFunction: SERVICE_MOTION_TOKENS.easeCss,
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4 transition-opacity ${
        isOpen
          ? "pointer-events-auto bg-black/60 opacity-100 backdrop-blur-sm"
          : "pointer-events-none bg-black/0 opacity-0"
      }`}
      style={transitionStyle}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl transform transition-[opacity,transform] ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
        style={transitionStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Content */}
        <div className="flex max-h-[min(92dvh,760px)] min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#e8e4dc] bg-white shadow-[0_14px_40px_rgba(26,31,46,0.18),0_2px_8px_rgba(26,31,46,0.1)]">
          {/* Header */}
          <div className="relative shrink-0 border-b border-[#e8e4dc] bg-gradient-to-br from-[#fdfcfa] to-white px-6 pb-6 pt-8 sm:px-8">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f8f6f2] hover:text-[#1a1f2e]"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            {/* Icon */}
            <div
              className={cn(
                SERVICE_ICON_THEME.containerBase,
                SERVICE_ICON_THEME.sizes.detail.container,
                "shadow-sm"
              )}
            >
              <span
                className={cn(
                  SERVICE_ICON_THEME.iconBase,
                  SERVICE_ICON_THEME.sizes.detail.icon
                )}
              >
                {icon}
              </span>
            </div>

            {/* Title */}
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#1a1f2e] sm:text-4xl">
              {service.title}
            </h2>

            {/* Short Description */}
            <p className="mt-2 text-base text-[#6b7280]">
              {shortDescription}
            </p>
          </div>

          {/* Body - Scrollable */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-5 sm:px-8 sm:py-8">
            {/* Detailed Description */}
            <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-h3:text-xl prose-h3:text-[#1a1f2e] prose-p:text-[#4a5568] prose-p:leading-relaxed prose-a:text-[#b89a5e] prose-a:no-underline hover:prose-a:text-[#9f8450]">
              {detailedDescription.split("\n").map((paragraph, idx) => (
                <p key={idx} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Price Range */}
            {service.price_range && (
              <div className="mt-6 rounded-xl border border-[#e8e4dc] bg-[#fdfcfa] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-[#6b7280]">
                  <span className="material-symbols-outlined text-base text-[#b89a5e]">
                    payments
                  </span>
                  <span>Pricing:</span>
                  <span className="font-semibold text-[#1a1f2e]">
                    {service.price_range}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[#e8e4dc] bg-[#fdfcfa] px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#6b7280]">
                Need more information about this service?
              </div>
              <div className="flex flex-col gap-2 xs:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="min-h-[44px] w-full whitespace-nowrap xs:flex-1 sm:w-auto sm:flex-none"
                >
                  Close
                </Button>
                <Button
                  asChild
                  variant="primary"
                  size="sm"
                  className="min-h-[44px] w-full whitespace-nowrap xs:flex-1 sm:w-auto sm:flex-none"
                >
                  <Link href={contactHref} className="inline-flex items-center justify-center whitespace-nowrap">
                    <span className="material-symbols-outlined mr-2 text-base">
                      send
                    </span>
                    Get in Touch
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalTarget);
}
