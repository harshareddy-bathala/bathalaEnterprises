import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/structured-data";
import { getPropertiesFromSupabase } from "@/lib/supabase-queries";

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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com";

export const metadata: Metadata = {
  title: "Properties",
  description:
    "Explore featured Bathala Enterprises properties for rent, lease, and sale in Electronic City, Bengaluru.",
  alternates: {
    canonical: "/properties",
  },
};

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