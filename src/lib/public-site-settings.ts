import { unstable_noStore as noStore } from "next/cache";
import { siteConfig } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings-queries";

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSocialUrl(value: string | null | undefined): string | null {
  const trimmed = normalizeOptionalText(value);
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function createAddressVariants(address: string) {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const compact =
    segments.length >= 2
      ? `${segments[0]}, ${segments[1]}`
      : siteConfig.address.street + ", " + siteConfig.address.area;

  const badge =
    segments.length >= 2
      ? `${segments[segments.length - 2]}, ${segments[segments.length - 1]}`
      : `${siteConfig.address.area}, ${siteConfig.address.city}`;

  return {
    full: address,
    compact,
    badge,
  };
}

export type ResolvedPublicSiteSettings = {
  businessName: string;
  siteTitle: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  legalEmail: string;
  address: {
    full: string;
    compact: string;
    badge: string;
  };
  social: {
    facebook: string | null;
    twitter: string | null;
    instagram: string | null;
    linkedin: string | null;
  };
  hours: {
    weekdays: string;
    sunday: string;
  };
  mapEmbedUrl: string;
};

export async function getResolvedPublicSiteSettings(): Promise<ResolvedPublicSiteSettings> {
  noStore();

  const dbSettings = await getSiteSettings();

  const phone = normalizeOptionalText(dbSettings?.phone) ?? siteConfig.contact.phone;
  const email = normalizeOptionalText(dbSettings?.email) ?? siteConfig.contact.email;
  const siteTitle = normalizeOptionalText(dbSettings?.site_title) ?? siteConfig.businessName;
  const addressFull = normalizeOptionalText(dbSettings?.address) ?? siteConfig.address.full;

  return {
    businessName: siteTitle,
    siteTitle,
    phone,
    phoneDisplay: phone,
    email,
    legalEmail: email,
    address: createAddressVariants(addressFull),
    social: {
      facebook: normalizeSocialUrl(dbSettings?.facebook_url),
      twitter: normalizeSocialUrl(dbSettings?.twitter_url),
      instagram: normalizeSocialUrl(dbSettings?.instagram_url),
      linkedin: normalizeSocialUrl(dbSettings?.linkedin_url),
    },
    hours: {
      weekdays: siteConfig.hours.weekdays,
      sunday: siteConfig.hours.sunday,
    },
    mapEmbedUrl: siteConfig.mapEmbedUrl,
  };
}
