import { cache } from "react";
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

/**
 * Static fallback for callers that cannot tolerate a failed settings read
 * (e.g. the chat route, which must never present placeholder contact details).
 */
export const FALLBACK_PUBLIC_SITE_SETTINGS: ResolvedPublicSiteSettings = {
  businessName: siteConfig.businessName,
  siteTitle: siteConfig.businessName,
  phone: siteConfig.contact.phone,
  phoneDisplay: siteConfig.contact.phoneDisplay,
  email: siteConfig.contact.email,
  legalEmail: siteConfig.contact.legalEmail,
  address: createAddressVariants(siteConfig.address.full),
  social: {
    facebook: siteConfig.social.facebook,
    twitter: siteConfig.social.twitter,
    instagram: siteConfig.social.instagram,
    linkedin: siteConfig.social.linkedin,
  },
  hours: {
    weekdays: siteConfig.hours.weekdays,
    sunday: siteConfig.hours.sunday,
  },
  mapEmbedUrl: siteConfig.mapEmbedUrl,
};

/**
 * Resolved, CMS-editable business identity, with `siteConfig` as a per-field
 * fallback.
 *
 * Wrapped in `React.cache()` so the Footer (rendered in the `(site)` layout on
 * every page) and the page body share one Supabase round-trip per render.
 *
 * This previously called `unstable_noStore()`, which opted every page in the
 * `(site)` group out of static rendering — the Footer is in the shared layout,
 * so `export const revalidate = 60` on the pages was being silently defeated.
 * Freshness now comes from ISR revalidation, which is the right granularity:
 * these settings change rarely and are edited through the admin CMS.
 */
export const getResolvedPublicSiteSettings = cache(async (): Promise<ResolvedPublicSiteSettings> => {
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
});
