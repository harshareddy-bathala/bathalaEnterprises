import dynamic from "next/dynamic";
import { JsonLd } from "@/components/json-ld";
import type { Metadata } from "next";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/structured-data";
import { getPropertiesFromSupabase } from "@/lib/supabase-queries";
import UniversalLoading from "@/components/ui/universal-loading";

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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com";

export const metadata: Metadata = {
  title: "All Properties",
  description:
    "Browse all Bathala Enterprises property listings for rent, lease, and sale in Electronic City, Bengaluru.",
  alternates: {
    canonical: "/all-properties",
  },
};

export default async function AllPropertiesPage() {
  const properties = await getPropertiesFromSupabase(false);

  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/all-properties`,
    "All Properties | Bathala Enterprises",
    "Browse all Bathala Enterprises property listings for rent, lease, and sale in Electronic City, Bengaluru."
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "All Properties", url: `${baseUrl}/all-properties` },
  ]);

  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <AllPropertiesClient properties={properties} />
    </>
  );
}
