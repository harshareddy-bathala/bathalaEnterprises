/**
 * JSON-LD Structured Data generators for SEO
 * Implements Schema.org types for Organization, LocalBusiness, and RealEstateListing
 */

import { siteConfig } from "./site-config";
import { siteUrl as baseUrl } from "./seo";
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
 * Generate Organization schema for the company
 */
export function generateOrganizationSchema(): OrganizationSchema {
  const socialLinks: string[] = [];
  if (siteConfig.social.facebook) socialLinks.push(siteConfig.social.facebook);
  if (siteConfig.social.twitter) socialLinks.push(siteConfig.social.twitter);
  if (siteConfig.social.instagram) socialLinks.push(siteConfig.social.instagram);
  if (siteConfig.social.linkedin) socialLinks.push(siteConfig.social.linkedin);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.businessName,
    url: baseUrl,
    logo: LOGO_URL,
    description: "Premium real estate services, property management, and advisory in Bangalore. Building trust, one property at a time.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.contact.phone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi", "Kannada"]
    },
    sameAs: socialLinks
  };
}

/**
 * Generate LocalBusiness schema for local SEO
 */
export function generateLocalBusinessSchema(): LocalBusinessSchema {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${baseUrl}/#business`,
    name: siteConfig.businessName,
    description: "Premium real estate services including property rental, lease, sale, and property management in Electronic City, Bangalore.",
    url: baseUrl,
    logo: LOGO_URL,
    image: SOCIAL_IMAGE_URL,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.pincode,
      addressCountry: "IN"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 12.8518078,
      longitude: 77.6471197
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
      name: siteConfig.businessName,
      publisher: {
        "@type": "Organization",
        name: siteConfig.businessName
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
    `Explore ${service.title} from ${siteConfig.businessName}.`;

  const schema: ServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": url,
    name: service.title,
    description: summary,
    provider: {
      "@type": "Organization",
      name: siteConfig.businessName,
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
