import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import Breadcrumb from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/json-ld";
import { formatNumber } from "@/lib/format";
import { displayPrice, prettyType, priceSuffix } from "@/lib/property-format";
import { PROPERTY_TYPE_BADGE_CLASSES } from "@/lib/theme-constants";
import { BLUR_DATA_URL, FALLBACK_IMAGES } from "@/lib/image-utils";
import {
  generateBreadcrumbSchema,
  generatePropertySchema,
  generateWebPageSchema,
} from "@/lib/structured-data";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPropertiesByIds,
  getPropertiesFromSupabase,
  getPropertyById,
} from "@/lib/supabase-queries";
import type { Property } from "@/lib/supabase-queries";

const PropertyGalleryLightbox = dynamic(
  () => import("@/components/property-gallery-lightbox"),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-2 gap-3 xs:gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-lg xs:rounded-xl" />
          ))}
        </div>
      </div>
    ),
  }
);

const revealDelay = (ms: number) => ({ "--reveal-delay": `${ms}ms` } as CSSProperties);

type PropertyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com";

export async function generateMetadata({
  params,
}: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    return {
      title: "Property Not Found | Bathala Enterprises",
      description:
        "The requested property listing could not be found. Browse available Bathala Enterprises properties in Bengaluru.",
      alternates: {
        canonical: "/all-properties",
      },
    };
  }

  const summary =
    property.description?.trim() ||
    `${property.bedrooms} BHK ${property.type} property in ${property.location}.`;

  return {
    title: `${property.title} | Properties | Bathala Enterprises`,
    description: summary.slice(0, 155),
    alternates: {
      canonical: `/properties/${property.id}`,
    },
  };
}

async function resolveRelatedProperties(property: Property): Promise<Property[]> {
  const relatedIds = (property.related_property_ids ?? []).filter(
    (propertyId) => propertyId !== property.id
  );

  let resolvedRelated: Property[] = [];

  if (relatedIds.length > 0) {
    resolvedRelated = await getPropertiesByIds(relatedIds, false);
  }

  if (resolvedRelated.length < 3) {
    const fallbackProperties = await getPropertiesFromSupabase(false);
    const existingIds = new Set([
      property.id,
      ...resolvedRelated.map((candidate) => candidate.id),
    ]);

    const fallbackCandidates = fallbackProperties
      .filter(
        (candidate) =>
          !existingIds.has(candidate.id) &&
          (candidate.type === property.type || candidate.location === property.location)
      )
      .slice(0, 3 - resolvedRelated.length);

    resolvedRelated = [...resolvedRelated, ...fallbackCandidates];
  }

  return resolvedRelated.slice(0, 3);
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  const [relatedProperties, mapQuery] = await Promise.all([
    resolveRelatedProperties(property),
    Promise.resolve(
      property.map_location && property.map_location.trim().length > 0
        ? property.map_location
        : property.location
    ),
  ]);

  const galleryImages = (property.gallery_images?.filter(Boolean) as string[] | undefined) ?? [];
  const amenities = (property.amenities?.filter(Boolean) as string[] | undefined) ?? [];

  const contactUrl = `/contact?${new URLSearchParams({
    query_type: "properties",
    service_type: property.type,
    property_id: property.id,
    property_title: property.title,
    property_type: property.type,
  }).toString()}#inquiry-form`;

  const propertySchema = generatePropertySchema(property);
  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/properties/${property.id}`,
    `${property.title} | Properties | Bathala Enterprises`,
    property.description || `${property.bedrooms} BHK ${property.type} property in ${property.location}.`
  );
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Properties", url: `${baseUrl}/all-properties` },
    { name: property.title, url: `${baseUrl}/properties/${property.id}` },
  ]);

  return (
    <div className="bathala-page pb-16 xs:pb-20 pt-10 xs:pt-14 sm:pt-16 safe-area-bottom">
      <JsonLd data={propertySchema} />
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="mx-auto max-w-[1200px] px-4 xs:px-5 md:px-10">
        <Breadcrumb
          className="mb-3"
          items={[
            { label: "Home", href: "/" },
            { label: "Properties", href: "/all-properties" },
            { label: property.title }
          ]}
        />

        <BackButton className="mb-6 xs:mb-8" fallbackHref="/all-properties" label="Back to Properties" />

        <div className="reveal-up" style={revealDelay(70)}>
          <div className="relative overflow-hidden rounded-[16px] xs:rounded-[22px] border border-[#e8e4dc] bg-[#ece7de]">
            <Image
              src={property.thumbnail_url || property.image_url || FALLBACK_IMAGES.property}
              alt={property.title}
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL.hero}
              className="object-cover"
            />
            <div className="h-[300px] xs:h-[350px] w-full sm:h-[400px] md:h-[480px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,22,30,0.55)] xs:from-[rgba(20,22,30,0.45)] to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 xs:bottom-6 xs:left-6 xs:right-6">
              <span
                className={`inline-flex h-[25px] xs:h-[27px] items-center rounded-full px-2.5 xs:px-3 text-[10px] xs:text-[10.5px] font-semibold uppercase tracking-[0.08em] ${PROPERTY_TYPE_BADGE_CLASSES[property.type]}`}
              >
                {prettyType(property.type)}
              </span>

              <h1 className="mt-2 xs:mt-3 font-display text-[26px] xs:text-[32px] font-semibold leading-[1.1] text-white drop-shadow-sm md:text-[42px]">
                {property.title}
              </h1>

              <p className="mt-1.5 xs:mt-2 flex items-center gap-1 text-[12px] xs:text-[13px] text-[rgba(255,255,255,0.82)]">
                <span className="material-symbols-outlined text-[13px] xs:text-[14px]">location_on</span>
                {property.location}
              </p>
            </div>
          </div>
        </div>

        <div className="reveal-up mt-6 xs:mt-8 grid gap-6 xs:gap-8 lg:grid-cols-[1.6fr_0.9fr]" style={revealDelay(120)}>
          <div className="space-y-6 xs:space-y-8">
            <div className="bathala-panel-strong p-4 xs:p-6">
              <p className="text-[10px] xs:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">Price</p>
              <p className="mt-1.5 xs:mt-2 text-[32px] xs:text-[40px] font-bold leading-[1] tracking-[-0.02em] text-[#1a1f2e]">
                {displayPrice(property.type, property.price)}
              </p>
              <p className="mt-1 text-[11px] xs:text-[12px] text-[#9ca3af]">{priceSuffix(property.type)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 xs:gap-4">
              <div className="bathala-panel p-4 xs:p-5 text-center">
                <span className="material-symbols-outlined text-[24px] xs:text-[28px] text-[#b89a5e]">bed</span>
                <p className="mt-1.5 xs:mt-2 text-[26px] xs:text-[30px] font-bold leading-[1] text-[#1a1f2e]">{property.bedrooms}</p>
                <p className="mt-1 text-[11px] xs:text-[12px] text-[#6b7280]">Bedrooms</p>
              </div>

              <div className="bathala-panel p-4 xs:p-5 text-center">
                <span className="material-symbols-outlined text-[24px] xs:text-[28px] text-[#b89a5e]">straighten</span>
                <p className="mt-1.5 xs:mt-2 text-[26px] xs:text-[30px] font-bold leading-[1] text-[#1a1f2e]">{formatNumber(property.sqft)}</p>
                <p className="mt-1 text-[11px] xs:text-[12px] text-[#6b7280]">Sq. Ft.</p>
              </div>
            </div>

            <section className="space-y-2 xs:space-y-3">
              <h2 className="font-display text-[28px] xs:text-[34px] font-semibold leading-[1.1] text-[#1a1f2e]">About This Property</h2>
              {property.description ? (
                <p className="whitespace-pre-line text-[15px] leading-[1.8] text-[#4a5568]">{property.description}</p>
              ) : (
                <p className="text-[15px] leading-[1.8] text-[#4a5568]">
                  This premium {property.type.toLowerCase()} property is located in {property.location}. It offers {property.bedrooms} bedroom
                  {property.bedrooms !== 1 ? "s" : ""} and {formatNumber(property.sqft)} square feet of thoughtfully planned space.
                </p>
              )}
            </section>

            {amenities.length > 0 && (
              <section className="space-y-3 xs:space-y-4">
                <h2 className="font-display text-[28px] xs:text-[34px] font-semibold leading-[1.1] text-[#1a1f2e]">Amenities</h2>
                <div className="flex flex-wrap gap-2 xs:gap-2.5">
                  {amenities.map((amenity, index) => (
                    <span
                      key={`${amenity}-${index}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e4dc] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4a5568]"
                    >
                      <span className="material-symbols-outlined text-[14px] text-[#b89a5e]">check_circle</span>
                      {amenity}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {galleryImages.length > 0 && (
              <div className="reveal-up" style={revealDelay(170)}>
                <PropertyGalleryLightbox title={property.title} images={galleryImages} />
              </div>
            )}
          </div>

          <aside className="reveal-up order-first lg:order-last" style={revealDelay(180)}>
            <div className="space-y-4 xs:space-y-6 bathala-panel-strong p-4 xs:p-6 lg:sticky lg:top-[84px]">
              <div>
                <h3 className="font-display text-[24px] xs:text-[27px] font-semibold leading-[1.1] text-[#1a1f2e]">Interested?</h3>
                <p className="mt-1.5 xs:mt-2 text-[13px] xs:text-[14px] leading-[1.7] text-[#6b7280]">
                  Contact us for details, site visits, or to discuss financing options.
                </p>
              </div>

              <Button asChild size="lg" className="w-full">
                <Link href={contactUrl}>Request More Info</Link>
              </Button>

              <div className="space-y-3 border-t border-[#ece7de] pt-4">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">Property ID</p>
                  <p className="font-mono text-[13px] text-[#4a5568]">{property.id}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">Type</p>
                  <p className="text-[14px] font-semibold text-[#1a1f2e]">{prettyType(property.type)}</p>
                </div>
              </div>

              <div className="border-t border-[#ece7de] pt-4">
                <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">Contact Agent</p>
                <Button asChild variant="secondary" className="w-full gap-2">
                  <Link href={contactUrl}>
                    <span className="material-symbols-outlined text-[17px]">call</span>
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>

        {relatedProperties.length > 0 && (
          <section className="reveal-up mt-10 xs:mt-12" style={revealDelay(220)}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-[28px] xs:text-[34px] font-semibold leading-[1.1] text-[#1a1f2e]">Related Properties</h2>
              <Link
                href="/all-properties"
                className="inline-flex min-h-[44px] items-center gap-1 text-[12px] xs:text-[13px] font-medium text-[#b89a5e] transition-colors hover:text-[#9f8450] touch-manipulation"
              >
                View all
                <span className="material-symbols-outlined text-[13px] xs:text-[14px]">arrow_forward</span>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {relatedProperties.map((relatedProperty, index) => (
                <Link
                  key={relatedProperty.id}
                  href={`/properties/${relatedProperty.id}`}
                  className="group overflow-hidden rounded-xl border border-[#e8e4dc] bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#ece7de]">
                    <Image
                      src={relatedProperty.thumbnail_url || relatedProperty.image_url || FALLBACK_IMAGES.property}
                      alt={relatedProperty.title}
                      fill
                      loading={index < 2 ? "eager" : "lazy"}
                      priority={index < 1}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL.property}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <span
                      className={`inline-flex h-[24px] items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${PROPERTY_TYPE_BADGE_CLASSES[relatedProperty.type]}`}
                    >
                      {prettyType(relatedProperty.type)}
                    </span>
                    <h3 className="line-clamp-2 text-[16px] font-semibold leading-[1.4] text-[#1a1f2e]">
                      {relatedProperty.title}
                    </h3>
                    <p className="text-[13px] text-[#6b7280]">{displayPrice(relatedProperty.type, relatedProperty.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="reveal-up mt-10 xs:mt-12" style={revealDelay(250)}>
          <h2 className="mb-4 font-display text-[28px] xs:text-[34px] font-semibold leading-[1.1] text-[#1a1f2e]">Location</h2>
          <div className="overflow-hidden rounded-[16px] xs:rounded-[20px] border border-[#e8e4dc] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              className="h-72 xs:h-80 sm:h-96 w-full border-0"
              loading="lazy"
              title={`Map location for ${property.title}`}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
