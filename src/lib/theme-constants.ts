import type { PropertyType } from "@/types/tables";

export const THEME_HEX = {
  textPrimary: "#1a1f2e",
  textSecondary: "#2c3340",
  textMuted: "#6b7280",
  textSubtle: "#9ca3af",
  accentGold: "#b89a5e",
  accentGoldDeep: "#9f8450",
  border: "#e8e4dc"
} as const;

export const PROPERTY_TYPE_BADGE_CLASSES: Record<PropertyType, string> = {
  Rent: "bg-[rgba(44,51,64,0.82)] text-white",
  Sale: "bg-[rgba(184,154,94,0.92)] text-[#1a1f2e]",
  Lease: "bg-[rgba(255,255,255,0.92)] text-[#2c3340]"
};

export const PROPERTY_FILTER_STATE_CLASSES = {
  active: "border-[#b89a5e] bg-[#b89a5e] text-[#1a1f2e]",
  inactive: "border-[#e8e4dc] bg-white text-[#6b7280] transition-colors hover:text-[#2c3340]"
} as const;

export const SERVICE_ICON_THEME = {
  containerBase:
    "inline-flex items-center justify-center border border-[#f0ede7] bg-[#fdfcfa] transition-[background-color,border-color] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:border-[#d4b87a] group-hover:bg-[#f8f4ea]",
  iconBase:
    "material-symbols-outlined text-[#b89a5e] transition-colors duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:text-[#9f8450]",
  sizes: {
    compact: {
      container: "h-[44px] w-[44px] rounded-[10px]",
      icon: "text-[22px]",
    },
    list: {
      container: "h-[60px] w-[60px] rounded-[14px]",
      icon: "text-[28px]",
    },
    detail: {
      container: "h-16 w-16 rounded-2xl",
      icon: "text-[32px]",
    },
    related: {
      container: "h-11 w-11 rounded-lg",
      icon: "text-[21px]",
    },
  },
} as const;

export const SERVICE_MOTION_TOKENS = {
  revealDurationMs: 320,
  revealDurationSeconds: 0.32,
  modalEnterDurationMs: 300,
  modalExitDurationMs: 220,
  easeCurve: [0.22, 1, 0.36, 1] as const,
  easeCss: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;