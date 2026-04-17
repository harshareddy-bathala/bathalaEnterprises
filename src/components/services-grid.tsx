"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import RevealOnView from "@/components/reveal-on-view";
import ServiceDetailModal from "@/components/service-detail-modal";
import { cn } from "@/lib/utils";
import { SERVICE_ICON_THEME } from "@/lib/theme-constants";
import { getServiceIconFromRecord, getServiceSummary } from "@/lib/service-format";
import type { Service } from "@/lib/supabase-queries";

const SERVICES_HOME_CACHE_KEY = "bathala:cache:home-services:v1";

type ServicesGridProps = {
  services: Service[];
  limit?: number;
  showViewAll?: boolean;
  showHeader?: boolean;
};

type ServicesGridCardProps = {
  service: Service;
  idx: number;
  onQuickPreview: (service: Service) => void;
};

function ServicesGridCard({ service, idx, onQuickPreview }: ServicesGridCardProps) {
  const icon = getServiceIconFromRecord(service);

  return (
    <article
      className={cn(
        "group flex h-full flex-col px-5 pb-8 pt-8 sm:px-7 md:min-h-[284px] md:px-9 md:pb-9 md:pt-10 transition-[background-color] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fdfcf9]",
        idx > 0 && "border-t border-[#f0ede7]",
        idx < 3 && "md:border-t-0",
        idx >= 3 && "md:border-t md:border-[#f0ede7]",
        idx % 3 !== 0 && "md:border-l md:border-[#f0ede7]"
      )}
    >
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

      <h3 className="mt-5 font-display text-[18px] font-semibold leading-[23.4px] text-[#1a1f2e] group-hover:text-[#b89a5e]">
        {service.title}
      </h3>

      <p className="mt-2 flex-1 text-[14px] leading-[1.6] text-[#6b7280]">
        {getServiceSummary(service, "Service details are being updated.", 160)}
      </p>

      <div className="mt-auto flex min-h-[44px] flex-wrap items-center gap-x-4 gap-y-2 pt-4">
        <button
          type="button"
          onClick={() => onQuickPreview(service)}
          className="group/quick inline-flex min-h-[44px] touch-manipulation items-center gap-1 whitespace-nowrap text-[13px] font-medium text-[#b89a5e] hover:text-[#9f8450]"
        >
          Quick Preview
          <span className="material-symbols-outlined text-[14px]">visibility</span>
        </button>

        <Link
          href={`/all-services/${service.id}`}
          className="group/details inline-flex min-h-[44px] touch-manipulation items-center gap-1 whitespace-nowrap text-[13px] font-medium text-[#b89a5e] hover:text-[#9f8450]"
        >
          View Details
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </article>
  );
}

export default function ServicesGrid({
  services,
  limit = Number.POSITIVE_INFINITY,
  showViewAll = false,
  showHeader = true,
}: ServicesGridProps) {
  const [sourceServices, setSourceServices] = useState<Service[]>(services);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cachedAtLabel, setCachedAtLabel] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (services.length > 0) {
      setSourceServices(services);
      setUsingCachedData(false);

      const savedAt = Date.now();
      window.localStorage.setItem(
        SERVICES_HOME_CACHE_KEY,
        JSON.stringify({
          savedAt,
          items: services,
        })
      );

      setCachedAtLabel(
        new Date(savedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      return;
    }

    try {
      const cachedRaw = window.localStorage.getItem(SERVICES_HOME_CACHE_KEY);
      if (!cachedRaw) {
        setSourceServices([]);
        setUsingCachedData(false);
        setCachedAtLabel(null);
        return;
      }

      const cached = JSON.parse(cachedRaw) as {
        savedAt?: number;
        items?: Service[];
      };

      if (Array.isArray(cached.items) && cached.items.length > 0) {
        setSourceServices(cached.items);
        setUsingCachedData(true);
        if (typeof cached.savedAt === "number") {
          setCachedAtLabel(
            new Date(cached.savedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      }
    } catch {
      setSourceServices([]);
      setUsingCachedData(false);
      setCachedAtLabel(null);
    }
  }, [services]);

  const displayedServices = sourceServices.slice(0, Math.min(limit, sourceServices.length));

  const handleLearnMore = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedService(null), 300);
  };

  return (
    <>
      <section id="services" className="bg-white py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-6 md:px-10">
          {showHeader && (
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[420px]">
                <div className="flex items-center gap-3">
                  <span className="h-[1.5px] w-8 bg-[#b89a5e]" />
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#b89a5e]">What We Offer</p>
                </div>

                <h2 className="mt-4 font-display text-[clamp(1.95rem,3vw,2.2rem)] font-bold leading-[1.15] tracking-[-0.02em] text-[#1a1f2e]">
                  End-to-End Property <span className="italic text-[#4a5568]">Services</span>
                </h2>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#6b7280]">
                  From finding your dream home to keeping it in perfect condition.
                </p>
              </div>

              {showViewAll ? (
                <Link
                  href="/all-services"
                  className="inline-flex items-center gap-1 self-start text-[14px] font-medium text-[#b89a5e] transition-colors hover:text-[#9f8450] md:mb-1 md:self-auto"
                >
                  View All Services
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              ) : null}
            </div>
          )}

          {usingCachedData ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
              <span className="material-symbols-outlined text-sm">history</span>
              <span>
                Refreshing services. Showing saved results{cachedAtLabel ? ` from ${cachedAtLabel}` : ""} for now.
              </span>
            </div>
          ) : null}

          {displayedServices.length > 0 ? (
            <div className={cn("grid md:grid-cols-3", showHeader ? "mt-10 md:mt-12" : "mt-0")}>
              {displayedServices.map((service, idx) => (
                <RevealOnView key={service.id} delayMs={idx * 55} threshold={0.2}>
                  <ServicesGridCard
                    service={service}
                    idx={idx}
                    onQuickPreview={handleLearnMore}
                  />
                </RevealOnView>
              ))}
            </div>
          ) : (
            <RevealOnView className="mt-14" threshold={0.15}>
              <EmptyState
                title="Services Coming Soon"
                description="We are preparing our latest service offerings. Reach out and we will get back quickly."
                icon="handyman"
                action={
                  <Button asChild variant="outline" size="lg">
                    <Link href="/contact?query_type=services#inquiry-form">Contact Us</Link>
                  </Button>
                }
              />
            </RevealOnView>
          )}
        </div>
      </section>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}