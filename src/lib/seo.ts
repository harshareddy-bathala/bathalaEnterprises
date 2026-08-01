/**
 * Shared SEO helpers.
 *
 * Single source of truth for the canonical site URL and for building complete,
 * per-page `Metadata`. Next does NOT deep-merge `openGraph`/`twitter` — a page
 * that omits them inherits the root layout's object verbatim, which is why every
 * route used to share the homepage's social card. Always build page metadata
 * through `buildMetadata` so those blocks are filled in per route.
 *
 * On images: because a page's `openGraph` object *replaces* the parent's rather
 * than merging into it, the root `opengraph-image.tsx` does not reach any page
 * that calls `buildMetadata`. So the site-default image is set explicitly here.
 * Segments that ship their own `opengraph-image.tsx` (property and service
 * detail) still win — file-based metadata takes precedence over config-based
 * metadata within the same segment.
 */

import type { Metadata } from "next";

export const SITE_NAME = "Bathala Enterprises";

/**
 * Canonical origin, without a trailing slash. Every absolute URL in metadata,
 * sitemaps, robots and JSON-LD derives from this.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com"
).replace(/\/+$/, "");

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return path === "/" ? siteUrl : `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Site-wide fallback social card, rendered by `src/app/opengraph-image.tsx`. */
const DEFAULT_OG_IMAGE = {
  url: `${siteUrl}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — Premium Real Estate Services in Bengaluru`,
};

export type BuildMetadataInput = {
  /**
   * Page title WITHOUT the " | Bathala Enterprises" suffix — the root layout's
   * title template appends it. Passing the suffix here double-renders it.
   */
  title: string;
  description: string;
  /** Site-relative path, e.g. "/about". Used for both canonical and og:url. */
  path: string;
  type?: "website" | "article";
  /** Set false for pages that must not be indexed (maintenance, admin, offline). */
  index?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  type = "website",
  index = true,
}: BuildMetadataInput): Metadata {
  // og:title does not pass through the root title template, so spell it out.
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type,
      locale: "en_IN",
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
    ...(index
      ? {}
      : {
          robots: {
            index: false,
            follow: false,
          },
        }),
  };
}
