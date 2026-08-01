import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/structured-data";
import { getPropertiesFromSupabase } from "@/lib/supabase-queries";
import { buildMetadata, siteUrl as baseUrl } from "@/lib/seo";

const PropertiesCarousel = dynamic(
  () => import("@/components/properties-carousel"),
  {
    ssr: true,
    loading: () => (
      <div className="bathala-page px-5 pb-20 pt-14 md:px-10 sm:pt-16">
        <div className="mx-auto max-w-[1200px] animate-pulse rounded-[16px] border border-[#ece7de] bg-white p-8">
          Loading properties...
        </div>
      </div>
    ),
  }
);

// This legacy grid 301-redirects to /all-properties in production, so it must
// not self-canonicalize (a canonical pointing at a redirect) and must not be
// indexed. Phase 2 of the SEO work replaces this route outright.
export const metadata: Metadata = buildMetadata({
  title: "Properties",
  description:
    "Explore featured Bathala Enterprises properties for rent, lease, and sale in Electronic City, Bengaluru.",
  path: "/all-properties",
  index: false,
});

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function PropertiesPage() {
  const properties = await getPropertiesFromSupabase(false);

  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/properties`,
    "Properties | Bathala Enterprises",
    "Explore featured Bathala Enterprises properties for rent, lease, and sale in Electronic City, Bengaluru."
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Properties", url: `${baseUrl}/properties` },
  ]);

  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="bathala-page pb-20 pt-14 sm:pt-16">
        <PropertiesCarousel properties={properties} />
      </div>
    </>
  );
}