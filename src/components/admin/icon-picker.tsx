"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
}

// Material Symbols commonly used for real estate services
const COMMON_ICONS = [
  "home",
  "apartment",
  "house",
  "villa",
  "real_estate_agent",
  "sell",
  "key",
  "handshake",
  "gavel",
  "account_balance",
  "description",
  "assignment",
  "calculate",
  "payments",
  "trending_up",
  "savings",
  "business",
  "domain",
  "construction",
  "engineering",
  "design_services",
  "architecture",
  "floor_plan",
  "straighten",
  "rule",
  "palette",
  "brush",
  "location_on",
  "map",
  "explore",
  "search",
  "analytics",
  "assessment",
  "verified",
  "verified_user",
  "security",
  "shield",
  "lock",
  "support_agent",
  "contact_support",
  "help",
  "info",
  "campaign",
  "notifications_active",
];

export default function IconPicker({
  value,
  onChange,
  disabled = false,
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return COMMON_ICONS;
    }

    const query = searchQuery.toLowerCase();
    return COMMON_ICONS.filter((icon) => icon.includes(query));
  }, [searchQuery]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <Input
        type="text"
        placeholder="Search icons..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={disabled}
        className="w-full"
      />

      {/* Current Selection */}
      {value && (
        <div className="flex items-center gap-2 rounded-lg border border-[#e8e4dc] bg-[#f8f6f2] p-3">
          <span className="material-symbols-outlined text-2xl text-[#1a1f2e]">
            {value}
          </span>
          <span className="text-sm text-[#6b7280]">Selected: {value}</span>
        </div>
      )}

      {/* Icon Grid */}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-[#e8e4dc] bg-white p-2">
        {filteredIcons.length > 0 ? (
          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => !disabled && onChange(iconName)}
                disabled={disabled}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-all ${
                  value === iconName
                    ? "border-[#b89a5e] bg-[#b89a5e]/10"
                    : "border-transparent hover:bg-[#f8f6f2]"
                } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                title={iconName}
              >
                <span className="material-symbols-outlined text-xl text-[#1a1f2e]">
                  {iconName}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-[#6b7280]">
            No icons found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-[#6b7280]">
        Select an icon from the grid above or search for specific icons.
      </p>
    </div>
  );
}
