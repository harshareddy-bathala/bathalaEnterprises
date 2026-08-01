import dynamic from "next/dynamic";
import { JsonLd } from "@/components/json-ld";
import type { Metadata } from "next";
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateWebPageSchema,
} from "@/lib/structured-data";
import { getPropertiesFromSupabase } from "@/lib/supabase-queries";
import { propertyPath } from "@/lib/slug";
import UniversalLoading from "@/components/ui/universal-loading";
import { buildMetadata, SITE_NAME, siteUrl as baseUrl } from "@/lib/seo";

const AllPropertiesClient = dynamic(
  () => import("@/components/all-properties-client"),
  {
    ssr: true,
    loading: () => (
      <UniversalLoading
        message="Loading properties"
        detail="Preparing listings and filters..."
        className="px-5 pb-20 pt-14 md:px-10 sm:pt-16"
      />
    ),
  }
);

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "Properties for Rent, Lease and Sale in Electronic City",
  description:
    "Browse all Bathala Enterprises property listings for rent, lease, and sale in Electronic City, Bengaluru.",
  path: "/properties",
});

export default async function PropertiesPage() {
  const properties = await getPropertiesFromSupabase(false);

  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/properties`,
    `Properties | ${SITE_NAME}`,
    "Browse all Bathala Enterprises property listings for rent, lease, and sale in Electronic City, Bengaluru."
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Properties", url: `${baseUrl}/properties` },
  ]);

  // Lets an agent enumerate the whole catalogue from this one page.
  const itemListSchema = generateItemListSchema(
    "Bathala Enterprises property listings",
    `${baseUrl}/properties`,
    properties.map((property) => ({
      name: property.title,
      url: `${baseUrl}${propertyPath(property)}`,
    }))
  );

  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <AllPropertiesClient properties={properties} />
    </>
  );
}
