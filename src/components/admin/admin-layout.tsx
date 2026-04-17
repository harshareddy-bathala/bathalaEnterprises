"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ConnectionStatusIndicator from "@/components/connection-status-indicator";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase-client";

// Navigation items
const NAV_MAIN = [
  { label: "Dashboard", icon: "dashboard", href: "/admin/dashboard" },
  { label: "Properties", icon: "home_work", href: "/admin/properties" },
  { label: "Messages", icon: "chat", href: "/admin/messages" },
];

const NAV_MANAGE = [
  { label: "Services", icon: "design_services", href: "/admin/services" },
  { label: "Testimonials", icon: "star", href: "/admin/testimonials" },
  { label: "Settings", icon: "settings", href: "/admin/settings" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  unreadCount?: number;
  adminName?: string;
}

export default function AdminLayout({
  children,
  title,
  description,
  action,
  unreadCount = 0,
  adminName = "Admin",
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    for (const item of [...NAV_MAIN, ...NAV_MANAGE]) {
      router.prefetch(item.href);
    }
  }, [router]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="h-screen w-full overflow-hidden bg-[var(--admin-bg)] [--admin-bg:#f5f4f2] [--admin-surface:#fcfcfb] [--admin-border:#e5e2db] [--admin-text:#1a1f2e] [--admin-muted:#6b7280] [--admin-text-muted:#6b7280] [--admin-accent:#b89a5e] [--admin-success:#059669] [--admin-warning:#c2410c] [--admin-error:#dc2626] [--admin-info:#2563eb] [--shadow-touch:0_2px_4px_rgba(0,0,0,0.05)] [--shadow-medium:0_8px_16px_rgba(0,0,0,0.08)] [--shadow-deep:0_16px_32px_rgba(0,0,0,0.12)]">
      <div className="flex h-screen">
        {/* Mobile Menu Toggle */}
        <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-[#e5e2db] bg-[#fcfcfb]/95 p-4 backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#2d3548] text-white shadow-md">
              <span className="material-symbols-outlined text-lg">business</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1f2e]">Bathala Admin</p>
              <p className="text-[10px] text-[#9ca3af]">Enterprise Portal</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-[#f3f1ed] touch-manipulation"
          >
            <span className="material-symbols-outlined text-xl">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {/* Sidebar - Fixed, Non-scrollable structure */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex h-screen w-[280px] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] transition-transform duration-300 ease-out lg:translate-x-0",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Logo - Fixed Header */}
          <div className="flex-shrink-0 border-b border-[var(--admin-border)]/70 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#2d3548] text-white shadow-lg">
                <span className="material-symbols-outlined text-xl">business</span>
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#1a1f2e]">Bathala Admin</p>
                <p className="text-[11px] text-[#9ca3af]">Enterprise Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation - fixed in flow so main content is the only vertical scroller */}
          <nav className="flex-1 overflow-x-hidden p-4">
            {/* Main Section */}
            <div className="mb-6">
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
                Main
              </p>
              <div className="space-y-1">
                {NAV_MAIN.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-[#b89a5e] to-[#c9a96a] text-white shadow-md"
                        : "text-[#6b7280] hover:bg-[#f3f1ed] hover:text-[#1a1f2e]"
                    )}
                  >
                    <span className={cn(
                      "material-symbols-outlined text-lg transition-transform duration-200",
                      !isActive(item.href) && "group-hover:scale-110"
                    )}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.label === "Messages" && unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Manage Section */}
            <div>
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
                Manage
              </p>
              <div className="space-y-1">
                {NAV_MANAGE.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-[#b89a5e] to-[#c9a96a] text-white shadow-md"
                        : "text-[#6b7280] hover:bg-[#f3f1ed] hover:text-[#1a1f2e]"
                    )}
                  >
                    <span className={cn(
                      "material-symbols-outlined text-lg transition-transform duration-200",
                      !isActive(item.href) && "group-hover:scale-110"
                    )}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* User Profile - Fixed Footer */}
          <div className="flex-shrink-0 border-t border-[var(--admin-border)] p-4">
            <div className="flex items-center justify-between rounded-2xl border border-[#e5e2db] bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1f2e] to-[#3d4558] text-xs font-bold text-white shadow-sm">
                  {getInitials(adminName)}
                </div>
                <div>
                  <p className="text-sm font-semibold capitalize text-[#1a1f2e]">{adminName}</p>
                  <p className="text-[11px] text-[#9ca3af]">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9ca3af] transition-all hover:bg-red-50 hover:text-red-600 touch-manipulation"
                title="Logout"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content - Full width with sidebar offset */}
        <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden pt-[72px] lg:ml-[280px] lg:pt-0">
          {/* Page Header */}
          <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-[var(--admin-border)] bg-white/95 px-4 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1f2e]">{title}</h1>
              {description && (
                <p className="mt-1 text-sm text-[#6b7280]">{description}</p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-safe [overscroll-behavior-y:contain] [touch-action:pan-y] sm:p-5 lg:p-6">
            <div className="min-w-0 [&_.overflow-x-auto]:-mx-2 [&_.overflow-x-auto]:px-2 [&_table]:min-w-[680px] sm:[&_.overflow-x-auto]:mx-0 sm:[&_.overflow-x-auto]:px-0 sm:[&_table]:min-w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
      <ConnectionStatusIndicator />
    </div>
  );
}

// Reusable card component for admin pages
export function AdminCard({
  children,
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "glass" | "panel";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--admin-border)] bg-white p-5 shadow-sm",
        variant === "glass" && "bg-white/70 backdrop-blur-md",
        variant === "panel" && "border-[#ded7cb] bg-[#fcfbf8]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminPanel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <AdminCard
      variant="panel"
      className={cn("p-6", className)}
      {...props}
    >
      {children}
    </AdminCard>
  );
}

// Status badge component
export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
}) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant]
      )}
    >
      {status}
    </span>
  );
}

// Empty state component
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3f1ed]">
        <span className="material-symbols-outlined text-3xl text-[#9ca3af]">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-[#1a1f2e]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[#6b7280]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Loading state component
export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#e5e2db] border-t-[#b89a5e]" />
      <p className="text-sm text-[#6b7280]">{message}</p>
    </div>
  );
}

// Error alert component
export function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
      <span className="material-symbols-outlined text-red-600">error</span>
      <p className="flex-1 text-sm text-red-700">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}

// Success alert component
export function SuccessAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
      <span className="material-symbols-outlined text-green-600">check_circle</span>
      <p className="flex-1 text-sm text-green-700">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-green-400 hover:text-green-600">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}

// Info banner component
export function InfoBanner({
  message,
  icon = "info",
}: {
  message: string;
  icon?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <span className="material-symbols-outlined text-blue-600">{icon}</span>
      <p className="text-sm text-blue-700">{message}</p>
    </div>
  );
}
