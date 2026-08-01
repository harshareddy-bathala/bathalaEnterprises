import Link from "next/link";
import type { Metadata } from "next";
import RevealOnView from "@/components/reveal-on-view";
import Breadcrumb from "@/components/ui/breadcrumb";
import EmptyState from "@/components/ui/empty-state";
import { JsonLd } from "@/components/json-ld";
import { cn } from "@/lib/utils";
import { SERVICE_ICON_THEME } from "@/lib/theme-constants";
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateWebPageSchema,
} from "@/lib/structured-data";
import { getServicesFromSupabase, servicePath } from "@/lib/supabase-queries";
import { getServiceIconFromRecord, getServiceSummary } from "@/lib/service-format";
import { buildMetadata, SITE_NAME, siteUrl as baseUrl } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "Property Management and Advisory Services in Bengaluru",
  description:
    "Explore all Bathala Enterprises services including property management, leasing support, maintenance, and advisory in Bengaluru.",
  path: "/services",
});

export default async function AllServicesPage() {
  const services = await getServicesFromSupabase();

  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/services`,
    `Services | ${SITE_NAME}`,
    "Explore all Bathala Enterprises services including property management, leasing support, maintenance, and advisory in Bengaluru."
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Services", url: `${baseUrl}/services` },
  ]);

  // Lets an agent enumerate the whole service catalogue from this one page.
  const itemListSchema = generateItemListSchema(
    "Bathala Enterprises property services",
    `${baseUrl}/services`,
    services.map((service) => ({
      name: service.title,
      url: `${baseUrl}${servicePath(service)}`,
    }))
  );

  return (
    <div className="bathala-page pb-20 pt-14 sm:pt-16">
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <Breadcrumb className="mb-6 md:mb-7" items={[{ label: "Home", href: "/" }, { label: "Services" }]} />

        <RevealOnView className="mb-12 text-center" delayMs={70} threshold={0.14}>
          <div className="flex items-center justify-center gap-2">
            <span className="h-[1.5px] w-8 rounded-full bg-[#b89a5e]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">Our Services</span>
            <span className="h-[1.5px] w-8 rounded-full bg-[#b89a5e]" />
          </div>
          <h1 className="mt-4 font-display text-[clamp(2rem,8vw,46px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#1a1f2e]">
            End-to-End <span className="italic text-[#4a5568]">Property Services</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[520px] text-[16px] leading-[1.6] text-[#6b7280]">
            Explore our complete range of {services.length} tailored offerings for rentals, sales, and maintenance.
          </p>
        </RevealOnView>

        {services.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, idx) => {
              const icon = getServiceIconFromRecord(service);

              return (
                <RevealOnView key={service.id} delayMs={idx * 55} threshold={0.22}>
                  <div className="group h-full rounded-[20px] border border-[#ece7de] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow,background-color] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[#d9cda9] hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)] hover:bg-[#fefdfb]">
                    <div className="mb-4 flex items-start gap-4">
                      <div
                        className={cn(
                          SERVICE_ICON_THEME.containerBase,
                          SERVICE_ICON_THEME.sizes.compact.container
                        )}
                      >
                        <span
                          className={cn(
                            SERVICE_ICON_THEME.iconBase,
                            SERVICE_ICON_THEME.sizes.compact.icon
                          )}
                        >
                          {icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-[22px] font-semibold leading-[1.2] text-[#1a1f2e] group-hover:text-[#b89a5e]">{service.title}</h3>
                        {service.price_range && (
                          <p className="text-sm font-semibold text-[#b89a5e]">{service.price_range}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-[14px] leading-[1.7] text-[#6b7280]">
                      {getServiceSummary(service, "Service details are being updated.", 180)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <Link
                        href={servicePath(service)}
                        className="group/details inline-flex items-center gap-1 text-[13px] font-medium text-[#b89a5e] hover:text-[#9f8450]"
                      >
                        View Details
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </RevealOnView>
              );
            })}
          </div>
        ) : (
          <RevealOnView threshold={0.15}>
            <EmptyState
              title="No services available yet"
              description="Service offerings are being updated. Please check again shortly."
              icon="handyman"
              actionLabel="Contact Us"
              actionHref="/contact?query_type=services#inquiry-form"
            />
          </RevealOnView>
        )}

        <RevealOnView className="mt-10 flex justify-center" delayMs={220} threshold={0.12}>
          <Link href="/" className="inline-flex items-center gap-1 text-[14px] font-medium text-[#b89a5e] transition-colors hover:text-[#9f8450]">
            Back to Home
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </RevealOnView>
      </div>
    </div>
  );
}
