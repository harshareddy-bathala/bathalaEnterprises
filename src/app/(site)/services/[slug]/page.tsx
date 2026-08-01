import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { cn } from "@/lib/utils";
import { SERVICE_ICON_THEME } from "@/lib/theme-constants";
import {
  generateBreadcrumbSchema,
  generateServiceSchema,
  generateWebPageSchema,
} from "@/lib/structured-data";
import {
  getServiceBySlug,
  getServicesFromSupabase,
  servicePath,
} from "@/lib/supabase-queries";
import { getServiceIconFromRecord, getServiceSummary } from "@/lib/service-format";
import { buildMetadata, SITE_NAME, siteUrl as baseUrl } from "@/lib/seo";

export const revalidate = 60;

type ServiceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/** Pre-render the service catalog at build time; see the properties route. */
export async function generateStaticParams() {
  const services = await getServicesFromSupabase();
  return services.map((service) => ({
    slug: servicePath(service).replace("/services/", ""),
  }));
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return buildMetadata({
      title: "Service Not Found",
      description:
        "The requested service could not be found. Explore all available services from Bathala Enterprises.",
      path: "/services",
      index: false,
    });
  }

  return buildMetadata({
    title: `${service.title} | Services`,
    description: getServiceSummary(
      service,
      "Explore premium property services from Bathala Enterprises.",
      155
    ),
    path: servicePath(service),
    type: "article",
  });
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;

  const [service, allServices] = await Promise.all([
    getServiceBySlug(slug),
    getServicesFromSupabase(),
  ]);

  if (!service) {
    notFound();
  }

  // Legacy UUID URLs and slugs stale after a title edit both resolve above;
  // send them on to the canonical slug so only one URL is ever indexed.
  const canonicalPath = servicePath(service);
  if (canonicalPath !== `/services/${slug}`) {
    permanentRedirect(canonicalPath);
  }

  const icon = getServiceIconFromRecord(service);
  const summary = getServiceSummary(service, "Service details are being updated.", 220);

  const detailedDescription =
    service.detailed_description?.trim() ||
    service.card_description?.trim() ||
    "Detailed information for this service is being updated. Please contact us for complete guidance and current availability.";

  const descriptionParagraphs = detailedDescription
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const relatedServices = allServices
    .filter((item) => item.id !== service.id)
    .slice(0, 3);

  const contactUrl = `/contact?${new URLSearchParams({
    query_type: "services",
    service_type: service.title,
  }).toString()}#inquiry-form`;

  const serviceSchema = generateServiceSchema(service);
  const webPageSchema = generateWebPageSchema(
    `${baseUrl}${canonicalPath}`,
    `${service.title} | Services | ${SITE_NAME}`,
    summary
  );
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Services", url: `${baseUrl}/services` },
    { name: service.title, url: `${baseUrl}${canonicalPath}` },
  ]);

  return (
    <div className="bathala-page pb-20 pt-14 sm:pt-16">
      <JsonLd data={serviceSchema} />
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="mx-auto max-w-[1100px] px-5 md:px-10">
        <Link
          href="/services"
          className="inline-flex items-center gap-1 text-[14px] font-medium text-[#b89a5e] transition-colors hover:text-[#9f8450]"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
          Back to Services
        </Link>

        <section className="mt-8 overflow-hidden rounded-[24px] border border-[#e8e4dc] bg-gradient-to-br from-[#fdfcfa] to-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] md:p-8">
          <div
            className={cn(
              SERVICE_ICON_THEME.containerBase,
              SERVICE_ICON_THEME.sizes.detail.container,
              "shadow-sm"
            )}
          >
            <span
              className={cn(
                SERVICE_ICON_THEME.iconBase,
                SERVICE_ICON_THEME.sizes.detail.icon
              )}
            >
              {icon}
            </span>
          </div>

          <h1 className="mt-5 font-display text-[clamp(2rem,6vw,46px)] font-bold leading-[1.08] tracking-[-0.02em] text-[#1a1f2e]">
            {service.title}
          </h1>

          <p className="mt-3 max-w-[760px] text-[15px] leading-[1.75] text-[#4a5568]">
            {summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={contactUrl}>Request This Service</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">Browse All Services</Link>
            </Button>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
          <article className="rounded-[20px] border border-[#ece7de] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] md:p-8">
            <h2 className="font-display text-[32px] font-semibold leading-[1.1] text-[#1a1f2e]">
              What This Includes
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-[1.8] text-[#4a5568]">
              {descriptionParagraphs.map((paragraph, idx) => (
                <p key={`${service.id}-paragraph-${idx}`}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="rounded-[20px] border border-[#ece7de] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <h2 className="font-display text-[24px] font-semibold text-[#1a1f2e]">
              Service Snapshot
            </h2>

            <div className="mt-5 space-y-4 border-t border-[#ece7de] pt-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">Service ID</p>
                <p className="mt-1 break-all font-mono text-[12px] text-[#4a5568]">{service.id}</p>
              </div>

              {service.price_range && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">Pricing</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#1a1f2e]">{service.price_range}</p>
                </div>
              )}

              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">Category</p>
                <p className="mt-1 text-[14px] font-semibold text-[#1a1f2e]">Property Services</p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#ece7de] pt-5">
              <Button asChild variant="secondary" className="w-full gap-2">
                <Link href={contactUrl}>
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">send</span>
                  Contact Team
                </Link>
              </Button>
            </div>
          </aside>
        </section>

        {relatedServices.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2">
              <span className="h-[1.5px] w-5 rounded-[2px] bg-[#b89a5e]" />
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">
                Related Services
              </p>
            </div>

            <h2 className="mt-2 font-display text-[clamp(1.6rem,4.2vw,32px)] font-bold leading-[1.12] text-[#1a1f2e]">
              You May Also Need
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedServices.map((item) => {
                const relatedIcon = getServiceIconFromRecord(item);
                return (
                  <article
                    key={item.id}
                    className="group rounded-[16px] border border-[#ece7de] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,background-color] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[#d9cda9] hover:bg-[#fefdfb] hover:shadow-[0_8px_18px_rgba(0,0,0,0.07)]"
                  >
                    <div
                      className={cn(
                        SERVICE_ICON_THEME.containerBase,
                        SERVICE_ICON_THEME.sizes.related.container
                      )}
                    >
                      <span
                        className={cn(
                          SERVICE_ICON_THEME.iconBase,
                          SERVICE_ICON_THEME.sizes.related.icon
                        )}
                      >
                        {relatedIcon}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-[20px] font-semibold leading-[1.2] text-[#1a1f2e]">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-[13.5px] leading-[1.65] text-[#6b7280]">
                      {getServiceSummary(item, "Service details are being updated.", 120)}
                    </p>

                    <Link
                      href={servicePath(item)}
                      className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[#b89a5e] transition-colors hover:text-[#9f8450]"
                    >
                      View Details
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}