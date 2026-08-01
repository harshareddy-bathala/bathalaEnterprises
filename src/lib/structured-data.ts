/**
 * JSON-LD Structured Data generators for SEO
 * Implements Schema.org types for Organization, LocalBusiness, and RealEstateListing
 */

import { SITE_NAME, siteUrl as baseUrl } from "./seo";
import type { ResolvedPublicSiteSettings } from "./public-site-settings";
import type { Property } from "./supabase-queries";
import type { Service } from "./supabase-queries";
import { propertyPath, servicePath } from "./slug";

/**
 * Schema.org consumers fetch these directly, so they must be stable, real URLs
 * — not the hashed `opengraph-image` route. `android-chrome-512x512.png` is the
 * existing square brand mark in `public/`.
 */
const LOGO_URL = `${baseUrl}/android-chrome-512x512.png`;
const SOCIAL_IMAGE_URL = `${baseUrl}/opengraph-image`;

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  contactPoint: {
    "@type": "ContactPoint";
    telephone: string;
    contactType: string;
    areaServed: string;
    availableLanguage: string[];
  };
  sameAs: string[];
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
    bestRating: number;
    worstRating: number;
  };
}

export interface LocalBusinessSchema {
  "@context": "https://schema.org";
  "@type": "RealEstateAgent";
  "@id": string;
  name: string;
  description: string;
  url: string;
  logo: string;
  image: string;
  telephone: string;
  email: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  priceRange: string;
  areaServed: {
    "@type": "City";
    name: string;
  };
}

export interface RealEstateListingSchema {
  "@context": "https://schema.org";
  "@type": "RealEstateListing";
  "@id": string;
  name: string;
  description: string;
  url: string;
  image: string[];
  datePosted: string;
  offers: {
    "@type": "Offer";
    price: number;
    priceCurrency: string;
    availability: string;
  };
  address: {
    "@type": "PostalAddress";
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  floorSize?: {
    "@type": "QuantitativeValue";
    value: number;
    unitCode: string;
  };
  numberOfBedrooms?: number;
  numberOfRooms?: number;
}

export interface ItemListSchema {
  "@context": "https://schema.org";
  "@type": "ItemList";
  "@id": string;
  name: string;
  url: string;
  numberOfItems: number;
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    url: string;
  }[];
}

export interface FaqPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[];
}

export interface WebPageSchema {
  "@context": "https://schema.org";
  "@type": "WebPage";
  "@id": string;
  url: string;
  name: string;
  description: string;
  isPartOf: {
    "@type": "WebSite";
    "@id": string;
    url: string;
    name: string;
    publisher: {
      "@type": "Organization";
      name: string;
    };
  };
}

export interface ServiceSchema {
  "@context": "https://schema.org";
  "@type": "Service";
  "@id": string;
  name: string;
  description: string;
  provider: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  areaServed: {
    "@type": "City";
    name: string;
  };
  serviceType: string;
  offers?: {
    "@type": "Offer";
    priceCurrency: string;
    priceSpecification: {
      "@type": "PriceSpecification";
      description: string;
    };
  };
}

/**
 * Generate Organization schema for the company.
 *
 * Takes resolved settings so the emitted identity matches what the admin CMS
 * shows. `sameAs` was previously always empty because every siteConfig.social
 * value is null; it now comes from site_settings, including the Google Business
 * Profile URL.
 */
export function generateOrganizationSchema(
  settings: ResolvedPublicSiteSettings,
  ratings?: { ratingValue: number; reviewCount: number }
): OrganizationSchema {
  const schema: OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.businessName,
    url: baseUrl,
    logo: LOGO_URL,
    description: "Premium real estate services, property management, and advisory in Bangalore. Building trust, one property at a time.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: settings.phone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi", "Kannada"]
    },
    sameAs: settings.sameAs
  };

  if (ratings && ratings.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(ratings.ratingValue.toFixed(1)),
      reviewCount: ratings.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Generate LocalBusiness schema for local SEO.
 * Address and coordinates come from site_settings rather than constants.
 */
export function generateLocalBusinessSchema(
  settings: ResolvedPublicSiteSettings
): LocalBusinessSchema {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${baseUrl}/#business`,
    name: settings.businessName,
    description: "Premium real estate services including property rental, lease, sale, and property management in Electronic City, Bangalore.",
    url: baseUrl,
    logo: LOGO_URL,
    image: SOCIAL_IMAGE_URL,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.streetAddress,
      addressLocality: settings.address.addressLocality,
      addressRegion: settings.address.addressRegion,
      postalCode: settings.address.postalCode,
      addressCountry: settings.address.addressCountry
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: settings.geo.latitude,
      longitude: settings.geo.longitude
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "19:00"
      }
    ],
    priceRange: "₹₹",
    areaServed: {
      "@type": "City",
      name: "Bangalore"
    }
  };
}

/**
 * Generate RealEstateListing schema for a property
 */
export function generatePropertySchema(property: Property): RealEstateListingSchema {
  const priceValue = Number(property.price);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${baseUrl}${propertyPath(property)}`,
    name: property.title,
    description: property.description || `${property.bedrooms} BHK ${property.type} property in ${property.location}`,
    url: `${baseUrl}${propertyPath(property)}`,
    image: [property.image_url, property.thumbnail_url].filter(Boolean) as string[],
    // Must be the real listing date. Stamping `new Date()` told Google every
    // property was posted at render time, on every render.
    datePosted: property.created_at ?? property.updated_at ?? new Date().toISOString(),
    offers: {
      "@type": "Offer",
      price: priceValue,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock"
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location || "Electronic City",
      addressRegion: "Karnataka",
      addressCountry: "IN"
    },
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.sqft,
      unitCode: "FTK"
    },
    numberOfBedrooms: property.bedrooms,
    numberOfRooms: property.bedrooms + 2
  };
}

/**
 * Generate an ItemList for a listing page.
 *
 * This is the highest-value addition for AI agents and answer engines: it lets
 * a crawler enumerate the entire catalog from a single fetch of the listing
 * page rather than discovering each detail page individually.
 */
export function generateItemListSchema(
  name: string,
  listUrl: string,
  items: { name: string; url: string }[]
): ItemListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${listUrl}#list`,
    name,
    url: listUrl,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

/** Generate FAQPage schema from the shared FAQ content. */
export function generateFaqSchema(
  entries: readonly { question: string; answer: string }[]
): FaqPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

/**
 * Generate Breadcrumb schema
 */
export function generateBreadcrumbSchema(
  items: { name: string; url?: string }[]
): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {})
    }))
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(
  url: string,
  name: string,
  description: string
): WebPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url,
    url,
    name,
    description,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: SITE_NAME,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME
      }
    }
  };
}

/**
 * Generate Service schema for a service detail page.
 */
export function generateServiceSchema(service: Service): ServiceSchema {
  const url = `${baseUrl}${servicePath(service)}`;
  const summary =
    service.card_description?.trim() ||
    service.detailed_description?.trim() ||
    `Explore ${service.title} from ${SITE_NAME}.`;

  const schema: ServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": url,
    name: service.title,
    description: summary,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
    },
    areaServed: {
      "@type": "City",
      name: "Bengaluru",
    },
    serviceType: "Property Services",
  };

  if (service.price_range?.trim()) {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "PriceSpecification",
        description: service.price_range,
      },
    };
  }

  return schema;
}
