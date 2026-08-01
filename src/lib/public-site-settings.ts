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

type StructuredAddressParts = {
  streetAddress?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  postalCode?: string | null;
  addressCountry?: string | null;
};

function createAddressVariants(address: string, parts: StructuredAddressParts = {}) {
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
    // Structured parts fall back to siteConfig when the columns from
    // SUPABASE_ADD_BUSINESS_PROFILE.sql are missing or blank.
    streetAddress: normalizeOptionalText(parts.streetAddress) ?? siteConfig.address.street,
    addressLocality: normalizeOptionalText(parts.addressLocality) ?? siteConfig.address.city,
    addressRegion: normalizeOptionalText(parts.addressRegion) ?? siteConfig.address.state,
    postalCode: normalizeOptionalText(parts.postalCode) ?? siteConfig.address.pincode,
    addressCountry: normalizeOptionalText(parts.addressCountry) ?? "IN",
  };
}

/** Fallback coordinates for the Electronic City office. */
const DEFAULT_GEO = { latitude: 12.8518078, longitude: 77.6471197 };

function toCoordinate(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
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
    /** Structured parts for schema.org PostalAddress. */
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  social: {
    facebook: string | null;
    twitter: string | null;
    instagram: string | null;
    linkedin: string | null;
    googleBusiness: string | null;
  };
  /** Every non-null social/profile URL, for schema.org sameAs. */
  sameAs: string[];
  hours: {
    weekdays: string;
    sunday: string;
  };
  mapEmbedUrl: string;
};

function buildSameAs(social: ResolvedPublicSiteSettings["social"]): string[] {
  return [
    social.googleBusiness,
    social.instagram,
    social.linkedin,
    social.facebook,
    social.twitter,
  ].filter((url): url is string => Boolean(url));
}

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
  geo: DEFAULT_GEO,
  social: {
    facebook: siteConfig.social.facebook,
    twitter: siteConfig.social.twitter,
    instagram: siteConfig.social.instagram,
    linkedin: siteConfig.social.linkedin,
    googleBusiness: null,
  },
  sameAs: [],
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

  const social = {
    facebook: normalizeSocialUrl(dbSettings?.facebook_url),
    twitter: normalizeSocialUrl(dbSettings?.twitter_url),
    instagram: normalizeSocialUrl(dbSettings?.instagram_url),
    linkedin: normalizeSocialUrl(dbSettings?.linkedin_url),
    googleBusiness: normalizeSocialUrl(dbSettings?.google_business_url),
  };

  return {
    businessName: siteTitle,
    siteTitle,
    phone,
    phoneDisplay: phone,
    email,
    legalEmail: email,
    address: createAddressVariants(addressFull, {
      streetAddress: dbSettings?.street_address,
      addressLocality: dbSettings?.address_locality,
      addressRegion: dbSettings?.address_region,
      postalCode: dbSettings?.postal_code,
      addressCountry: dbSettings?.address_country,
    }),
    geo: {
      latitude: toCoordinate(dbSettings?.latitude, DEFAULT_GEO.latitude),
      longitude: toCoordinate(dbSettings?.longitude, DEFAULT_GEO.longitude),
    },
    social,
    sameAs: buildSameAs(social),
    hours: {
      weekdays: siteConfig.hours.weekdays,
      sunday: siteConfig.hours.sunday,
    },
    mapEmbedUrl: siteConfig.mapEmbedUrl,
  };
});
