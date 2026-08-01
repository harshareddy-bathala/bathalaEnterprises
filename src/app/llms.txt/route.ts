import { getPropertiesFromSupabase, getServicesFromSupabase } from "@/lib/supabase-queries";
import { getResolvedPublicSiteSettings } from "@/lib/public-site-settings";
import { propertyPath, servicePath } from "@/lib/slug";
import { displayPrice, prettyType, priceSuffix } from "@/lib/property-format";
import { getServiceSummary } from "@/lib/service-format";
import { FAQ_ENTRIES } from "@/lib/faq-content";
import { SITE_NAME, siteUrl } from "@/lib/seo";

/**
 * /llms.txt — a structured, plain-text entry point for AI agents and answer
 * engines, following the llms.txt convention.
 *
 * Deliberately a dynamic route rather than a static file in public/, so it
 * always reflects the live catalogue. Revalidated hourly: agents do not need
 * minute-level freshness and this keeps the database load trivial.
 */
export const revalidate = 3600;

export async function GET() {
  const [properties, services, settings] = await Promise.all([
    getPropertiesFromSupabase(false),
    getServicesFromSupabase(),
    getResolvedPublicSiteSettings(),
  ]);

  const propertyLines = properties.map((property) => {
    const price = `${displayPrice(property.type, property.price, { currencyMode: "code" })} ${priceSuffix(property.type)}`;
    return `- [${property.title}](${siteUrl}${propertyPath(property)}): ${prettyType(property.type)} in ${property.location}. ${property.bedrooms} bed, ${property.sqft} sq.ft. ${price}.`;
  });

  const serviceLines = services.map((service) => {
    const summary = getServiceSummary(service, "Property service.", 160);
    return `- [${service.title}](${siteUrl}${servicePath(service)}): ${summary}`;
  });

  const body = `# ${SITE_NAME}

> Real-estate agency in Electronic City, Bengaluru, Karnataka, India. We list
> properties for rent, lease and sale, and provide property management,
> leasing support, maintenance coordination and advisory services.

## Business details

- Name: ${settings.businessName}
- Service area: ${settings.address.addressLocality}, ${settings.address.addressRegion}, India (primarily Electronic City and surrounding south Bengaluru micro-markets)
- Address: ${settings.address.full}
- Phone: ${settings.phoneDisplay}
- Email: ${settings.email}
- Hours: ${settings.hours.weekdays}; Sunday: ${settings.hours.sunday}
- Currency: INR (Indian Rupee)

## Key pages

- [Home](${siteUrl}/): overview of the agency, featured listings and services.
- [Properties](${siteUrl}/properties): full catalogue, filterable by rent / lease / sale.
- [Services](${siteUrl}/services): full service catalogue.
- [About](${siteUrl}/about): company background and values.
- [Contact](${siteUrl}/contact): enquiry form, phone, email and office location.
- [Privacy policy](${siteUrl}/privacy)
- [Terms of service](${siteUrl}/terms)

## Properties (${properties.length} currently available)

${propertyLines.length > 0 ? propertyLines.join("\n") : "- No properties are listed at the moment."}

## Services (${services.length})

${serviceLines.length > 0 ? serviceLines.join("\n") : "- No services are listed at the moment."}

## Frequently asked questions

${FAQ_ENTRIES.map((entry) => `### ${entry.question}\n\n${entry.answer}`).join("\n\n")}

## Notes for agents

- Prices are in Indian Rupees. Rent is quoted per month, lease per year, and
  sale prices are the asking price.
- Availability changes; the listing pages above are authoritative.
- Structured data is published as JSON-LD on every page (Organization,
  RealEstateAgent, RealEstateListing, Service, ItemList, FAQPage, BreadcrumbList).
- A machine-readable sitemap is at ${siteUrl}/sitemap.xml and an RSS feed of
  listings at ${siteUrl}/feed.xml.
- For anything not covered here, use the contact details above rather than
  inferring an answer.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
