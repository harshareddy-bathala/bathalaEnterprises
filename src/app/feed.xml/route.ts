import { getPropertiesFromSupabase } from "@/lib/supabase-queries";
import { propertyPath } from "@/lib/slug";
import { displayPrice, prettyType, priceSuffix } from "@/lib/property-format";
import { SITE_NAME, siteUrl } from "@/lib/seo";

/**
 * /feed.xml — RSS 2.0 feed of current listings.
 *
 * Property aggregators and AI crawlers both consume RSS, and it gives them a
 * cheap way to notice new listings without re-crawling the catalogue.
 */
export const revalidate = 3600;

const MAX_ITEMS = 50;

/** Escape the five XML predefined entities. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const properties = await getPropertiesFromSupabase(false);

  const items = [...properties]
    .sort((a, b) => {
      const aTime = new Date(a.created_at ?? 0).getTime();
      const bTime = new Date(b.created_at ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, MAX_ITEMS)
    .map((property) => {
      const url = `${siteUrl}${propertyPath(property)}`;
      const price = `${displayPrice(property.type, property.price, { currencyMode: "code" })} ${priceSuffix(property.type)}`;
      const description =
        property.description?.trim() ||
        `${property.bedrooms} BHK ${property.type} property in ${property.location}.`;
      const published = property.created_at
        ? new Date(property.created_at).toUTCString()
        : new Date().toUTCString();

      return `    <item>
      <title>${xmlEscape(property.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <pubDate>${published}</pubDate>
      <category>${xmlEscape(prettyType(property.type))}</category>
      <description>${xmlEscape(`${description} ${price}. Located in ${property.location}.`)}</description>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(`${SITE_NAME} — Property Listings`)}</title>
    <link>${siteUrl}/properties</link>
    <description>Latest properties for rent, lease and sale in Electronic City, Bengaluru.</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
