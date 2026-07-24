"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/all-properties", label: "Properties" },
  { href: "/all-services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const prefetchRoutes = ["/all-properties", "/all-services", "/about", "/contact", "/admin/login"];

function linkIsActive(pathname: string, href: string) {
  if (href.startsWith("/#")) {
    return pathname === "/";
  }

  const cleanHref = href.split("#")[0].split("?")[0] || "/";
  if (cleanHref === "/") {
    return href === "/" ? pathname === "/" : false;
  }

  return pathname.startsWith(cleanHref);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (hasPrefetched.current) {
      return;
    }

    hasPrefetched.current = true;
    const timer = window.setTimeout(() => {
      prefetchRoutes.forEach((route) => {
        if (route !== pathname) {
          router.prefetch(route);
        }
      });
    }, 160);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile menu backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[rgba(26,31,46,0.4)] backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <header className="sticky top-0 z-50 border-b border-[#ece7de] bg-[rgba(248,246,242,0.95)] backdrop-blur-lg safe-area-top">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="flex h-[72px] items-center justify-between gap-5">
            <Link
              href="/"
              className="relative flex min-h-[44px] items-center gap-2 touch-manipulation"
              aria-label="Bathala Enterprises - Home"
            >
              <span className="whitespace-nowrap font-display text-[18px] xs:text-[20px] font-medium leading-[30px] tracking-[-0.01em] text-[#1a1f2e]">
                Bathala Enterprises
              </span>
              <span className="mb-[2px] inline-block h-[5px] w-[5px] rounded-full bg-[#b89a5e]" aria-hidden="true" />
              <span
                className="pointer-events-none absolute left-0 top-[31px] h-[1.5px] w-[174px] bg-gradient-to-r from-[#b89a5e] to-transparent"
                aria-hidden="true"
              />
            </Link>

            <nav className="hidden items-center gap-9 md:flex" aria-label="Main navigation">
              {links.map((link) => {
                const active = linkIsActive(pathname, link.href);

                return (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    onMouseEnter={() => {
                      if (link.href !== pathname) {
                        router.prefetch(link.href);
                      }
                    }}
                    onFocus={() => {
                      if (link.href !== pathname) {
                        router.prefetch(link.href);
                      }
                    }}
                    className={cn(
                      "relative min-h-[44px] flex items-center pb-1 text-[13.5px] leading-[20.25px] transition-colors touch-manipulation",
                      "after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:rounded-full after:bg-[#b89a5e] after:transition-[width] after:duration-200 after:content-['']",
                      active ? "font-medium text-[#1a1f2e] after:w-full" : "font-normal text-[#6b7280] after:w-0 hover:text-[#2c3340] hover:after:w-full"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 xs:gap-4">
              <Link
                href="/contact"
                className="hidden h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[#b89a5e] px-4 xs:px-[22px] text-[12px] xs:text-[13px] font-semibold text-[#2c3340] shadow-[0_4px_16px_rgba(184,154,94,0.28)] transition-all hover:bg-[#a88c52] hover:shadow-[0_6px_20px_rgba(184,154,94,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e] focus-visible:ring-offset-2 sm:inline-flex touch-manipulation active:scale-95"
              >
                Book a Visit
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#2c3340] transition-all hover:bg-[#efebe4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e] focus-visible:ring-offset-2 md:hidden touch-manipulation active:scale-95"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[22px] transition-transform duration-300",
                    mobileOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                >
                  {mobileOpen ? "close" : "menu"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay Panel */}
      <nav
        id="mobile-nav"
        className={cn(
          "fixed inset-x-0 z-50 md:hidden",
          "top-[calc(72px+env(safe-area-inset-top))] transform-gpu transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          mobileOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        )}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        <div className="max-h-[min(calc(100dvh-72px),520px)] overflow-y-auto border-b border-[#ece7de] bg-[rgba(248,246,242,0.98)] backdrop-blur-lg">
          <div className="mx-auto max-w-[1200px] space-y-1 px-5 py-4 md:px-10">
            {links.map((link, index) => {
              const active = linkIsActive(pathname, link.href);

              return (
                <Link
                  key={`${link.href}-mobile-${link.label}`}
                  href={link.href}
                  onMouseEnter={() => {
                    if (link.href !== pathname) {
                      router.prefetch(link.href);
                    }
                  }}
                  onFocus={() => {
                    if (link.href !== pathname) {
                      router.prefetch(link.href);
                    }
                  }}
                  className={cn(
                    "flex min-h-[52px] items-center rounded-xl px-4 text-[16px] leading-[24px]",
                    "transition-all duration-200 focus-visible:outline-none focus-visible:bg-[#f6f1e5]",
                    "touch-manipulation active:scale-[0.98]",
                    active
                      ? "bg-[rgba(184,154,94,0.08)] font-semibold text-[#b89a5e]"
                      : "font-normal text-[#2c3340] hover:bg-[#f6f1e5]"
                  )}
                  tabIndex={mobileOpen ? 0 : -1}
                  aria-current={active ? "page" : undefined}
                  style={{
                    transitionDelay: mobileOpen ? `${index * 45}ms` : "0ms",
                    opacity: mobileOpen ? 1 : 0,
                    transform: mobileOpen ? "translateX(0)" : "translateX(-10px)",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="px-4 pb-2 pt-3">
              <Link
                href="/contact"
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-[#b89a5e] text-[15px] font-semibold text-[#2c3340] transition-all hover:bg-[#a88c52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e] focus-visible:ring-offset-2 touch-manipulation active:scale-[0.98]"
                tabIndex={mobileOpen ? 0 : -1}
              >
                Book a Visit
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
