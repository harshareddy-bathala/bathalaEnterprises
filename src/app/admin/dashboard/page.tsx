"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AdminLayout, {
  AdminCard,
  ErrorAlert,
  InfoBanner,
  LoadingState,
} from "@/components/admin/admin-layout";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase-client";
import { getAdminUser } from "@/lib/admin-auth";

type ListingType = "Rent" | "Lease" | "Sale";
type InquiryStatus = "new" | "in-progress" | "resolved";

type DashboardProperty = {
  id: string;
  title: string;
  type: ListingType;
  created_at: string | null;
};

type DashboardInquiry = {
  id: string;
  name: string;
  query_type: "properties" | "services" | "other";
  service_type: string;
  status: InquiryStatus;
  is_read: boolean;
  created_at: string | null;
};

type MetricCard = {
  id: string;
  icon: string;
  accentClassName: string;
  value: number;
  label: string;
  subtitle: string;
};

const STATUS_STYLES: Record<
  InquiryStatus,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  new: {
    label: "New",
    badgeClassName: "bg-[#eff6ff] text-[#2563eb]",
    dotClassName: "bg-[#3b82f6]",
  },
  "in-progress": {
    label: "Contacted",
    badgeClassName: "bg-[#fff7ed] text-[#c2410c]",
    dotClassName: "bg-[#f97316]",
  },
  resolved: {
    label: "Closed",
    badgeClassName: "bg-[#ecfdf3] text-[#059669]",
    dotClassName: "bg-[#10b981]",
  },
};

function normalizeInquiryStatus(value: unknown): InquiryStatus {
  if (value === "new" || value === "in-progress" || value === "resolved") {
    return value;
  }

  return "new";
}

function normalizeQueryType(value: unknown): "properties" | "services" | "other" {
  if (value === "properties" || value === "services") {
    return value;
  }

  return "other";
}

function formatLongDate(value: Date): string {
  const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(value);
  const day = new Intl.DateTimeFormat("en-IN", { day: "2-digit" }).format(value);
  const month = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(value);
  const year = new Intl.DateTimeFormat("en-IN", { year: "numeric" }).format(value);
  return `${weekday} ${day} ${month}, ${year}`;
}

function formatShortDate(value: string | null): string {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function isThisMonth(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const now = new Date();
  return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
}

function isWithinDays(value: string | null, days: number): boolean {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const now = Date.now();
  const diffMs = now - parsed.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "AD";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [properties, setProperties] = useState<DashboardProperty[]>([]);
  const [inquiries, setInquiries] = useState<DashboardInquiry[]>([]);
  const [isInquiryDataAvailable, setIsInquiryDataAvailable] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const todayLabel = useMemo(() => formatLongDate(new Date()), []);

  const fetchProperties = useCallback(async (): Promise<DashboardProperty[]> => {
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, type, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map((item: Record<string, unknown>) => ({
        id: String(item.id),
        title: typeof item.title === "string" ? item.title : "Untitled Property",
        type: item.type === "Lease" || item.type === "Sale" ? item.type : "Rent",
        created_at: typeof item.created_at === "string" ? item.created_at : null,
      }));
    } catch (error) {
      console.error("Failed to load dashboard properties:", error);
      setLoadError((prev) => prev || "Some dashboard data could not be loaded right now.");
      return [];
    }
  }, []);

  const fetchInquiries = useCallback(async (): Promise<DashboardInquiry[]> => {
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, name, query_type, service_type, status, is_read, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        const message = error.message.toLowerCase();
        if (message.includes("relation") || message.includes("does not exist") || message.includes("schema cache")) {
          setIsInquiryDataAvailable(false);
          return [];
        }

        throw error;
      }

      setIsInquiryDataAvailable(true);

      return (data || []).map((item: Record<string, unknown>) => ({
        id: String(item.id),
        name: typeof item.name === "string" ? item.name : "Unknown",
        query_type: normalizeQueryType(item.query_type),
        service_type: typeof item.service_type === "string" ? item.service_type : "General Inquiry",
        status: normalizeInquiryStatus(item.status),
        is_read: Boolean(item.is_read),
        created_at: typeof item.created_at === "string" ? item.created_at : null,
      }));
    } catch (error) {
      console.error("Failed to load dashboard messages:", error);
      setLoadError((prev) => prev || "Some dashboard data could not be loaded right now.");
      return [];
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!supabase) {
        router.push("/admin/login");
        return;
      }

      try {
        const adminUser = await getAdminUser();
        if (!adminUser) {
          router.push("/admin/login");
          return;
        }

        const nextAdminName =
          adminUser.user_metadata?.full_name ||
          adminUser.user_metadata?.name ||
          adminUser.email?.split("@")[0] ||
          "Admin";

        setAdminName(nextAdminName);
        setIsAuthenticated(true);

        const [propertyRows, inquiryRows] = await Promise.all([
          fetchProperties(),
          fetchInquiries(),
        ]);

        setProperties(propertyRows);
        setInquiries(inquiryRows);
      } finally {
        setLoading(false);
      }
    };

    void initializeDashboard();
  }, [fetchInquiries, fetchProperties, router]);

  useEffect(() => {
    if (!supabase || !isAuthenticated) {
      return;
    }

    const client = supabase;
    const channel = client
      .channel("admin-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          void fetchInquiries().then((rows) => {
            setInquiries(rows);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => {
          void fetchProperties().then((rows) => {
            setProperties(rows);
          });
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [fetchInquiries, fetchProperties, isAuthenticated]);

  const totalProperties = properties.length;
  const activeListings = properties.filter((item) => item.type !== "Sale").length;
  const saleListings = properties.filter((item) => item.type === "Sale").length;
  const propertiesAddedThisMonth = properties.filter((item) => isThisMonth(item.created_at)).length;
  const enquiriesThisWeek = inquiries.filter((item) => isWithinDays(item.created_at, 7)).length;
  const newEnquiriesCount = inquiries.filter((item) => item.status === "new").length;
  const unreadMessagesCount = inquiries.filter((item) => !item.is_read).length;

  const listingMix = useMemo(() => {
    const mix: Record<ListingType, number> = {
      Rent: 0,
      Lease: 0,
      Sale: 0,
    };

    for (const item of properties) {
      mix[item.type] += 1;
    }

    return mix;
  }, [properties]);

  const metrics: MetricCard[] = [
    {
      id: "total-properties",
      icon: "home_work",
      accentClassName: "bg-[#f6efe1] text-[#7c6442]",
      value: totalProperties,
      label: "Total Properties",
      subtitle: `+${propertiesAddedThisMonth} this month`,
    },
    {
      id: "active-listings",
      icon: "schedule",
      accentClassName: "bg-[#e6f2f9] text-[#2563eb]",
      value: activeListings,
      label: "Active Listings",
      subtitle: `${totalProperties === 0 ? 0 : Math.round((activeListings / totalProperties) * 100)}% of total`,
    },
    {
      id: "new-enquiries",
      icon: "chat",
      accentClassName: "bg-[#fcefe7] text-[#c2410c]",
      value: enquiriesThisWeek,
      label: "New Messages",
      subtitle: `+${newEnquiriesCount} unresolved`,
    },
    {
      id: "unread-inbox",
      icon: "mark_email_unread",
      accentClassName: "bg-[#f2f1ef] text-[#4b5563]",
      value: unreadMessagesCount,
      label: "Unread Inbox",
      subtitle: "Requires attention",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-5 lg:px-6">
        <LoadingState message="Loading dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout
      title="Dashboard"
      description={todayLabel}
      unreadCount={unreadMessagesCount}
      adminName={adminName}
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/messages" prefetch>
            <span className="material-symbols-outlined mr-2 text-[18px]" aria-hidden="true">mark_email_unread</span>
            {unreadMessagesCount} unread
          </Link>
        </Button>
      }
    >
      {loadError ? <ErrorAlert message={loadError} /> : null}

      {!isInquiryDataAvailable ? (
        <InfoBanner
          message="Message records are not available in this environment yet. The dashboard is showing available data only."
          icon="info"
        />
      ) : null}

      <header className="mb-7">
        <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-tight text-[var(--admin-text)]">
          Good morning, {adminName}
        </h1>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{todayLabel}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <AdminCard key={metric.id} className="flex flex-col p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", metric.accentClassName)}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{metric.icon}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[var(--admin-text-muted)]">{metric.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight text-[var(--admin-text)]">{metric.value.toLocaleString()}</p>
              <p className="text-xs font-medium text-[var(--admin-text-muted)]">{metric.subtitle}</p>
            </div>
          </AdminCard>
        ))}
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section
          id="enquiries-section"
          className="flex flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Recent Messages</h2>
            <Link href="/admin/messages" prefetch className="text-xs font-semibold text-[var(--admin-accent)]">
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#fafaf8]">
                <tr className="text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-text-muted)]">
                  <th className="px-4 py-3 sm:px-5">Contact</th>
                  <th className="hidden px-3 py-3 sm:table-cell">Interest</th>
                  <th className="hidden px-3 py-3 md:table-cell">Date</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right sm:px-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--admin-text-muted)]">
                      No message records available yet.
                    </td>
                  </tr>
                ) : (
                  inquiries.slice(0, 5).map((entry) => {
                    const statusStyle = STATUS_STYLES[entry.status];
                    const interestLabel =
                      entry.service_type ||
                      (entry.query_type === "services" ? "Service inquiry" : "Property inquiry");

                    return (
                      <tr key={entry.id} className="group transition-colors hover:bg-[#fcfaf7]">
                        <td className="px-4 py-4 sm:px-5 align-middle">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#ece7db] text-[11px] font-bold text-[var(--admin-text)]">
                              {getInitials(entry.name)}
                            </span>
                            <div className="flex flex-col justify-center">
                              <span className="font-semibold text-[var(--admin-text)] line-clamp-1">{entry.name}</span>
                              <span className="mt-0.5 text-[11px] text-[var(--admin-text-muted)] line-clamp-1 sm:hidden">{interestLabel}</span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-3 py-4 text-sm text-[var(--admin-text)] sm:table-cell align-middle">{interestLabel}</td>
                        <td className="hidden px-3 py-4 text-sm text-[var(--admin-text-muted)] md:table-cell align-middle">{formatShortDate(entry.created_at)}</td>
                        <td className="px-3 py-4 align-middle">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide",
                              statusStyle.badgeClassName
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dotClassName)} />
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right sm:px-5 align-middle">
                          <Link
                            href="/admin/messages"
                            prefetch
                            className="inline-flex h-8 items-center justify-center rounded-md bg-white border border-[var(--admin-border)] px-3 text-xs font-semibold text-[var(--admin-text)] shadow-sm transition hover:bg-[#faf9f6]"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--admin-border)] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold tracking-tight text-[var(--admin-text)]">Listing Breakdown</h3>
            </div>

            <div className="space-y-4">
              {(Object.keys(listingMix) as ListingType[]).map((key) => {
                const value = listingMix[key];
                const width = totalProperties === 0 ? 0 : Math.max(8, (value / totalProperties) * 100);

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--admin-text)]">{key}</span>
                      <span className="font-medium text-[var(--admin-text-muted)]">{value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1eee7]">
                      <div
                        className="h-full rounded-full bg-[var(--admin-accent)] transition-all duration-500 ease-out"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {saleListings > 0 && (
              <div className="mt-6 rounded-lg bg-[#faf8f4] p-3 text-xs font-medium text-[var(--admin-text-muted)]">
                <span className="font-bold text-[var(--admin-text)]">{saleListings} items</span> are currently listed for sale.
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="mt-5">
        <section
          id="properties-section"
          className="rounded-2xl border border-[var(--admin-border)] bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[15px] font-bold tracking-tight text-[var(--admin-text)]">Recent Properties</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {properties.slice(0, 4).map((property) => (
              <div
                key={property.id}
                className="flex flex-col justify-between rounded-xl border border-[var(--admin-border)] bg-[#faf9f6] p-4 transition-colors hover:bg-white"
              >
                <div>
                  <span className="mb-2 inline-flex items-center rounded-md bg-[#e8e4db] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text)]">
                    {property.type}
                  </span>
                  <p className="text-sm font-semibold text-[var(--admin-text)] line-clamp-1">{property.title}</p>
                </div>
                <p className="mt-3 text-xs font-medium text-[var(--admin-text-muted)]">{formatShortDate(property.created_at)}</p>
              </div>
            ))}

            {properties.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed border-[var(--admin-border)] px-4 py-8 text-center text-sm font-medium text-[var(--admin-text-muted)]">
                No properties available yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}