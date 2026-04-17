"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RevealOnView from "@/components/reveal-on-view";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { displayPrice, prettyType, priceSuffix } from "@/lib/property-format";
import { PROPERTY_FILTER_STATE_CLASSES, PROPERTY_TYPE_BADGE_CLASSES } from "@/lib/theme-constants";
import { BLUR_DATA_URL, FALLBACK_IMAGES, getLoadingStrategy } from "@/lib/image-utils";
import type { PropertyType } from "@/types/tables";
import type { Property } from "@/lib/supabase-queries";

const PROPERTIES_HOME_CACHE_KEY = "bathala:cache:home-properties:v1";

const typeFilters: { label: string; value?: PropertyType }[] = [
  { label: "All", value: undefined },
  { label: "For Rent", value: "Rent" },
  { label: "For Sale", value: "Sale" },
  { label: "For Lease", value: "Lease" },
];

const highlightLabels = ["Premium", "Best Seller", "New Listing"];

function getMetaTone(type: PropertyType) {
  if (type === "Sale") return "Ready Possession";
  if (type === "Lease") return "Managed Lease";
  return "Managed Listing";
}

export default function PropertiesCarousel({ properties }: { properties: Property[] }) {
  const [active, setActive] = useState<PropertyType | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [sourceProperties, setSourceProperties] = useState<Property[]>(properties);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cachedAtLabel, setCachedAtLabel] = useState<string | null>(null);

  const filtered = useMemo(
    () => sourceProperties.filter((property) => (active ? property.type === active : true)),
    [sourceProperties, active]
  );

  const displayedProperties = filtered.slice(0, 6);
  const hasMore = filtered.length > 6;

  // Check if scroll indicator should be shown
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      const isNotAtEnd = container.scrollLeft + container.clientWidth < container.scrollWidth - 10;
      setShowScrollIndicator(hasOverflow && isNotAtEnd);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (properties.length > 0) {
      setSourceProperties(properties);
      setUsingCachedData(false);

      const savedAt = Date.now();
      window.localStorage.setItem(
        PROPERTIES_HOME_CACHE_KEY,
        JSON.stringify({
          savedAt,
          items: properties,
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
      const cachedRaw = window.localStorage.getItem(PROPERTIES_HOME_CACHE_KEY);
      if (!cachedRaw) {
        setSourceProperties([]);
        setUsingCachedData(false);
        setCachedAtLabel(null);
        return;
      }

      const cached = JSON.parse(cachedRaw) as {
        savedAt?: number;
        items?: Property[];
      };

      if (Array.isArray(cached.items) && cached.items.length > 0) {
        setSourceProperties(cached.items);
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
      setSourceProperties([]);
      setUsingCachedData(false);
      setCachedAtLabel(null);
    }
  }, [properties]);

  return (
    <section id="properties" className="bg-[#f8f6f2] py-16 sm:py-20 md:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[390px]">
            <div className="flex items-center gap-2">
              <span className="h-[1.5px] w-6 rounded-full bg-[#b89a5e]" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#b89a5e]">Our Portfolio</span>
            </div>

            <h2 className="mt-3 font-display text-[clamp(2rem,8.5vw,50px)] font-semibold leading-[1.06] tracking-[-0.02em] text-[#1a1f2e]">
              Curated <span className="italic text-[#2c3340]">Properties</span>
            </h2>

            <p className="mt-3 text-[15px] leading-[1.55] text-[#6b7280]">
              Handpicked apartments and villas across Electronic City.
            </p>
          </div>

          <Link
            href="/all-properties"
            className="inline-flex items-center gap-1 self-start text-[14px] font-medium text-[#b89a5e] transition-colors hover:text-[#9f8450] md:self-auto touch-manipulation"
          >
            View All Properties
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </Link>
        </div>

        {/* Filter buttons with scroll indicator */}
        <div className="relative mt-9 sm:mt-10">
          <div 
            ref={scrollContainerRef}
            className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible"
            role="tablist"
            aria-label="Property type filters"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {typeFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setActive(filter.value)}
                role="tab"
                aria-selected={active === filter.value}
                aria-controls="properties-grid"
                className={cn(
                  "h-[44px] min-w-[44px] shrink-0 whitespace-nowrap rounded-full border px-5 text-[13px] tracking-[0.01em] transition-all touch-manipulation active:scale-95",
                  active === filter.value ? PROPERTY_FILTER_STATE_CLASSES.active : PROPERTY_FILTER_STATE_CLASSES.inactive
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Scroll fade indicator for mobile */}
          <div 
            className={cn(
              "absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-[#f8f6f2] to-transparent pointer-events-none transition-opacity duration-200 sm:hidden",
              showScrollIndicator ? "opacity-100" : "opacity-0"
            )}
            aria-hidden="true"
          />
        </div>

        {usingCachedData ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            <span className="material-symbols-outlined text-sm">history</span>
            <span>
              Refreshing listings. Showing saved properties{cachedAtLabel ? ` from ${cachedAtLabel}` : ""} for now.
            </span>
          </div>
        ) : null}

        {displayedProperties.length > 0 ? (
          <div 
            id="properties-grid"
            role="tabpanel"
            className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6"
            style={{ touchAction: 'pan-y' }}
          >
            {displayedProperties.map((property, idx) => (
              <RevealOnView key={property.id} delayMs={idx * 55} threshold={0.22}>
                <Link href={`/properties/${property.id}`} className="block touch-manipulation">
                  <article className="group h-full cursor-pointer overflow-hidden rounded-[20px] border border-[#e8e4dc] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:scale-[0.99]">
                    <div className="relative h-[240px] overflow-hidden rounded-t-[18px] bg-[#e8e4dc] xs:h-[268px] sm:h-[304px] md:h-[334px] lg:h-[360px]">
                      <Image
                        src={property.thumbnail_url || property.image_url || FALLBACK_IMAGES.property}
                        alt={property.title}
                        fill
                        sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px"
                        {...getLoadingStrategy(idx, active ? 0 : 2)}
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL.property}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,22,30,0.2)] to-transparent" />

                      <div className="absolute left-3 top-3 xs:left-3.5 xs:top-3.5">
                        <span
                          className={cn(
                            "inline-flex h-[24px] xs:h-[25.75px] items-center rounded-full px-2.5 xs:px-3 text-[10px] xs:text-[10.5px] font-semibold uppercase tracking-[0.08em]",
                            PROPERTY_TYPE_BADGE_CLASSES[property.type]
                          )}
                        >
                          {prettyType(property.type)}
                        </span>
                      </div>

                      <div className="absolute right-3 top-3 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(30,30,40,0.45)] text-white">
                        <span className="material-symbols-outlined text-[16px]">favorite</span>
                      </div>

                      <div className="absolute bottom-3 left-3 xs:bottom-3.5 xs:left-3.5 inline-flex h-[28px] xs:h-[30px] items-center rounded-[4px] bg-[rgba(255,255,255,0.92)] px-2">
                        <span className="text-[9px] xs:text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#b89a5e]">
                          {highlightLabels[idx % highlightLabels.length]}
                        </span>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-3.5 xs:px-4.5 xs:pb-5 xs:pt-4 sm:px-5">
                      <h3 className="text-[17px] xs:text-[19px] font-semibold leading-[24px] xs:leading-[26px] text-[#1a1f2e] transition-colors group-hover:text-[#2c3340] sm:text-[20px] sm:leading-[28px]">
                        {property.title}
                      </h3>

                      <p className="mt-1 xs:mt-1.5 flex items-center gap-1 text-[12px] xs:text-[12.5px] text-[#6b7280]">
                        <span className="material-symbols-outlined text-[12px] xs:text-[13px] text-[#9ca3af]">location_on</span>
                        {property.location}
                      </p>

                      <div className="mt-3 xs:mt-4 border-t border-[#f0ede7] pt-3 xs:pt-3.5">
                        <div className="flex flex-wrap items-center gap-y-2 text-[11px] xs:text-[11.5px] text-[#6b7280] sm:text-[12px]">
                          <span className="inline-flex items-center gap-1.5 pr-2">
                            <span className="material-symbols-outlined text-[13px] xs:text-[14px]">bed</span>
                            {property.bedrooms} BHK
                          </span>
                          <span className="h-3 w-px bg-[#e8e4dc]" />
                          <span className="inline-flex items-center gap-1.5 px-2">
                            <span className="material-symbols-outlined text-[13px] xs:text-[14px]">straighten</span>
                            {formatNumber(property.sqft)} sqft
                          </span>
                          <span className="hidden xs:block h-3 w-px bg-[#e8e4dc]" />
                          <span className="hidden xs:inline-flex items-center gap-1.5 pl-2">
                            <span className="material-symbols-outlined text-[14px]">apartment</span>
                            {getMetaTone(property.type)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 xs:mt-4 flex items-end justify-between">
                        <span>
                          <span className="block text-[22px] xs:text-[24px] font-bold leading-[1] tracking-[-0.02em] text-[#1a1f2e] sm:text-[27px]">
                            {displayPrice(property.type, property.price, { currencyMode: "code" })}
                          </span>
                          <span className="mt-0.5 xs:mt-1 block text-[10px] xs:text-[11px] tracking-[0.02em] text-[#9ca3af]">
                            {priceSuffix(property.type)}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[12px] xs:text-[13px] font-medium text-[#b89a5e]">
                          View Details
                          <span className="material-symbols-outlined text-[12px] xs:text-[13px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </RevealOnView>
            ))}
          </div>
        ) : (
          <RevealOnView className="mt-14 rounded-[16px] border border-[#ece7dd] bg-white p-6 xs:p-8 text-center" threshold={0.15}>
            <h3 className="font-display text-[28px] xs:text-[32px] font-semibold text-[#1a1f2e]">No Properties Available</h3>
            <p className="mt-2 text-[13px] xs:text-[14px] text-[#6b7280]">
              We are updating our portfolio. New listings will be published shortly.
            </p>
            <div className="mt-5">
              <Button asChild variant="outline" size="lg">
                <Link href="/contact?query_type=properties#inquiry-form">Get Notified</Link>
              </Button>
            </div>
          </RevealOnView>
        )}

        {hasMore && (
          <RevealOnView className="mt-8 flex justify-center" threshold={0.1}>
            <Button asChild variant="outline" size="lg">
              <Link href="/all-properties">Browse Full Portfolio</Link>
            </Button>
          </RevealOnView>
        )}

        {filtered.length > 0 && (
          <div className="mt-9 flex items-center gap-3 text-[11px] text-[#9ca3af] sm:mt-10 sm:text-[12px]">
            <span className="h-px flex-1 bg-[#e8e4dc]" />
            <span>
              Showing {displayedProperties.length} of {filtered.length} properties
            </span>
            <span className="h-px flex-1 bg-[#e8e4dc]" />
          </div>
        )}
      </div>
    </section>
  );
}
