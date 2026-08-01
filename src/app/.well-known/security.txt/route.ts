import { getResolvedPublicSiteSettings } from "@/lib/public-site-settings";
import { siteUrl } from "@/lib/seo";

/**
 * /.well-known/security.txt — RFC 9116 vulnerability disclosure contact.
 *
 * A route rather than a static file so the contact address tracks
 * site_settings, and so `Expires` stays in the future without manual edits
 * (RFC 9116 requires the field, and a stale value makes the file invalid).
 */
export const revalidate = 86400;

export async function GET() {
  const settings = await getResolvedPublicSiteSettings();

  // RFC 9116 recommends an expiry under a year out.
  const expires = new Date();
  expires.setUTCMonth(expires.getUTCMonth() + 6);

  const body = `# Security contact for ${siteUrl}
# https://www.rfc-editor.org/rfc/rfc9116

Contact: mailto:${settings.email}
Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, "Z")}
Preferred-Languages: en
Canonical: ${siteUrl}/.well-known/security.txt
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
