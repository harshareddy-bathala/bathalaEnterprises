"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { displayPrice, prettyType, priceSuffix } from "@/lib/property-format";
import { PROPERTY_FILTER_STATE_CLASSES, PROPERTY_TYPE_BADGE_CLASSES } from "@/lib/theme-constants";
import { BLUR_DATA_URL, FALLBACK_IMAGES, getLoadingStrategy } from "@/lib/image-utils";
import EmptyState from "@/components/ui/empty-state";
import Pagination from "@/components/ui/pagination";
import Breadcrumb from "@/components/ui/breadcrumb";
import type { Property } from "@/lib/supabase-queries";
import { propertyPath } from "@/lib/slug";

type FilterValue = "all" | "apartments" | "villas" | "rent" | "sale" | "lease";
const PROPERTIES_CACHE_KEY = "bathala:cache:all-properties:v1";

const typeFilters: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Apartments", value: "apartments" },
  { label: "Villas", value: "villas" },
  { label: "For Rent", value: "rent" },
  { label: "For Sale", value: "sale" },
  { label: "For Lease", value: "lease" },
];

const featureTags = ["Premium", "Best Seller", "New Listing"];

const revealDelay = (ms: number) => ({ "--reveal-delay": `${ms}ms` } as CSSProperties);

function isVilla(property: Property) {
  const source = `${property.title} ${property.description ?? ""} ${property.location}`.toLowerCase();
  return source.includes("villa");
}

export default function AllPropertiesClient({ properties }: { properties: Property[] }) {
  const [active, setActive] = useState<FilterValue>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sourceProperties, setSourceProperties] = useState<Property[]>(properties);
  const [isOffline, setIsOffline] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cachedAtLabel, setCachedAtLabel] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 6;

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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
        PROPERTIES_CACHE_KEY,
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
      const cachedRaw = window.localStorage.getItem(PROPERTIES_CACHE_KEY);
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
      // Ignore cache parsing errors and continue with live data fallback.
      setSourceProperties([]);
      setUsingCachedData(false);
      setCachedAtLabel(null);
    }
  }, [properties]);

  const filtered = useMemo(() => {
    if (active === "all") return sourceProperties;
    if (active === "apartments") return sourceProperties.filter((property) => !isVilla(property));
    if (active === "villas") return sourceProperties.filter((property) => isVilla(property));
    if (active === "rent") return sourceProperties.filter((property) => property.type === "Rent");
    if (active === "sale") return sourceProperties.filter((property) => property.type === "Sale");
    return sourceProperties.filter((property) => property.type === "Lease");
  }, [sourceProperties, active]);

  useEffect(() => {
    setCurrentPage(1);
  }, [active]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleProperties = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRefresh = () => {
    if (isOffline) {
      return;
    }
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <div className="bathala-page pb-20 pt-14 sm:pt-16">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <Breadcrumb className="mb-6 md:mb-7" items={[{ label: "Home", href: "/" }, { label: "Properties" }]} />

        {(isOffline || usingCachedData) && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {isOffline ? "wifi_off" : "sync"}
            </span>
            <span>
              {isOffline
                ? usingCachedData
                  ? `You are offline. Showing saved properties${cachedAtLabel ? ` from ${cachedAtLabel}` : ""}.`
                  : "You are offline. Reconnect to load the latest properties."
                : `Loading the latest properties. Showing saved results${cachedAtLabel ? ` from ${cachedAtLabel}` : ""} for now.`}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isOffline || isRefreshing}
              className="ml-auto inline-flex h-8 items-center gap-1 rounded-full border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
              Retry
            </button>
          </div>
        )}

        <div className="reveal-up mb-12 text-center" style={revealDelay(70)}>
          <div className="flex items-center justify-center gap-2">
            <span className="h-[1.5px] w-8 rounded-full bg-[#b89a5e]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">Our Portfolio</span>
            <span className="h-[1.5px] w-8 rounded-full bg-[#b89a5e]" />
          </div>
          <h1 className="mt-4 font-display text-[clamp(2rem,8vw,46px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#1a1f2e]">
            Explore Our <span className="italic text-[#4a5568]">Properties</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[460px] text-[16px] leading-[1.6] text-[#6b7280]">
            Handpicked apartments, villas, and commercial spaces across Electronic City, Bangalore.
          </p>
        </div>

        <div className="mb-8 border-y border-[#eee8dd] bg-[rgba(248,246,242,0.9)] py-3 backdrop-blur-sm md:sticky md:top-[72px] md:z-20">
          <div className="flex flex-wrap items-center justify-center gap-2">
          {typeFilters.map((filter) => {
            const selected = active === filter.value;

            return (
              <button
                key={filter.value}
                onClick={() => setActive(filter.value)}
                className={`h-[37.5px] rounded-full border px-5 text-[13px] ${selected ? PROPERTY_FILTER_STATE_CLASSES.active : PROPERTY_FILTER_STATE_CLASSES.inactive}`}
              >
                {filter.label}
              </button>
            );
          })}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {visibleProperties.map((property, idx) => (
            <Link key={property.id} href={propertyPath(property)}>
              <article className="group h-full cursor-pointer overflow-hidden rounded-[20px] border border-[#e8e4dc] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <div className="relative h-[268px] overflow-hidden rounded-t-[18px] bg-[#e8e4dc] sm:h-[304px] md:h-[334px] lg:h-[360px]">
                  <Image
                    src={property.thumbnail_url || property.image_url || FALLBACK_IMAGES.property}
                    alt={property.title}
                    fill
                    {...getLoadingStrategy(idx, 2)}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL.property}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,22,30,0.2)] to-transparent" />

                  <div className="absolute left-3.5 top-3.5">
                    <span
                      className={`inline-flex h-[25.75px] items-center rounded-full px-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${PROPERTY_TYPE_BADGE_CLASSES[property.type]}`}
                    >
                      {prettyType(property.type)}
                    </span>
                  </div>

                  <div className="absolute right-3 top-3 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(30,30,40,0.45)] text-white touch-manipulation">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">favorite</span>
                  </div>

                  <div className="absolute bottom-3.5 left-3.5 inline-flex h-[30px] items-center rounded-[4px] bg-[rgba(255,255,255,0.92)] px-2">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#b89a5e]">
                      {featureTags[idx % featureTags.length]}
                    </span>
                  </div>
                </div>

                <div className="px-4.5 pb-5 pt-4 sm:px-5">
                  <h3 className="text-[19px] font-semibold leading-[26px] text-[#1a1f2e] transition-colors group-hover:text-[#2c3340] sm:text-[20px] sm:leading-[28px]">
                    {property.title}
                  </h3>

                  <p className="mt-1.5 flex items-center gap-1 text-[12.5px] text-[#6b7280]">
                    <span className="material-symbols-outlined text-[13px] text-[#9ca3af]" aria-hidden="true">location_on</span>
                    {property.location}
                  </p>

                  <div className="mt-4 border-t border-[#f0ede7] pt-3.5">
                    <div className="flex flex-wrap items-center gap-y-2 text-[11.5px] text-[#6b7280] sm:text-[12px]">
                      <span className="inline-flex items-center gap-1.5 pr-2">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">bed</span>
                        {property.bedrooms} BHK
                      </span>
                      <span className="h-3 w-px bg-[#e8e4dc]" />
                      <span className="inline-flex items-center gap-1.5 px-2">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">straighten</span>
                        {formatNumber(property.sqft)} sqft
                      </span>
                      <span className="h-3 w-px bg-[#e8e4dc]" />
                      <span className="inline-flex items-center gap-1.5 pl-2">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">apartment</span>
                        {isVilla(property) ? "Villa" : "Apartment"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <span>
                      <span className="block text-[24px] font-bold leading-[1] tracking-[-0.02em] text-[#1a1f2e] sm:text-[27px]">
                        {displayPrice(property.type, property.price)}
                      </span>
                      <span className="mt-1 block text-[11px] tracking-[0.02em] text-[#9ca3af]">
                        {priceSuffix(property.type)}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#b89a5e]">
                      View Details
                      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState
            title="No properties match this filter"
            description="Try switching filters or clear your current selection to view all properties."
            icon="search_off"
            actionLabel="Clear Filters"
            actionHref="/properties"
          />
        )}

        {filtered.length > 0 && (
          <div className="mt-9 flex items-center gap-3 text-[11px] text-[#9ca3af] sm:text-[12px]">
            <span className="h-px flex-1 bg-[#e8e4dc]" />
            <span>
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} {filtered.length === 1 ? "property" : "properties"}
            </span>
            <span className="h-px flex-1 bg-[#e8e4dc]" />
          </div>
        )}

        {filtered.length > 0 ? (
          <Pagination className="mt-8" currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        ) : null}

        <div className="reveal-up mt-10 flex justify-center" style={revealDelay(220)}>
          <Link href="/" className="inline-flex items-center gap-1 text-[14px] font-medium text-[#b89a5e] transition-colors hover:text-[#9f8450]">
            Back to Home
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
