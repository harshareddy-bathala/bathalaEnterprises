import type { Service } from "@/types/tables";

type ServiceTextShape = {
  title?: string | null;
  card_description?: string | null;
  detailed_description?: string | null;
};

const LEGACY_ICON_MAP: Record<string, string> = {
  ShieldCheck: "shield",
  Wrench: "construction",
  Sparkles: "auto_awesome",
  BriefcaseBusiness: "work",
  Home: "home",
  Building: "apartment",
  Key: "key",
  Users: "group",
  FileText: "description",
  Landmark: "account_balance",
};

const MATERIAL_ICON_PATTERN = /^[a-z0-9_]+$/;

export function resolveServiceIcon(
  iconName: string | null | undefined,
  fallback = "auto_awesome"
): string {
  if (!iconName) {
    return fallback;
  }

  const trimmed = iconName.trim();
  if (!trimmed) {
    return fallback;
  }

  const legacy = LEGACY_ICON_MAP[trimmed];
  if (legacy) {
    return legacy;
  }

  if (MATERIAL_ICON_PATTERN.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return fallback;
}

export function getServiceSummary(
  service: ServiceTextShape,
  fallback = "Service details are being updated.",
  maxLength?: number
): string {
  const shortText = service.card_description?.trim();
  if (shortText) {
    return shortText;
  }

  const detailedText = service.detailed_description?.trim();
  if (!detailedText) {
    return fallback;
  }

  if (!maxLength || detailedText.length <= maxLength) {
    return detailedText;
  }

  return `${detailedText.slice(0, maxLength - 3).trimEnd()}...`;
}

export function getServiceSearchContent(service: ServiceTextShape): string {
  return [service.title, service.card_description, service.detailed_description]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ")
    .toLowerCase();
}

export function getServiceIconFromRecord(service: Pick<Service, "icon_name" | "icon">): string {
  return resolveServiceIcon(service.icon_name || service.icon || undefined);
}
