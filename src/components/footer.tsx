import Link from "next/link";
import { getResolvedPublicSiteSettings } from "@/lib/public-site-settings";

type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter";

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/all-services", label: "Our Services" },
  { href: "/all-properties", label: "Properties" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

function getDialPhone(phone: string): string {
  return phone.replace(/[^+\d]/g, "");
}

function SocialLogo({ platform }: { platform: SocialPlatform }) {
  if (platform === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.5 22v-8h2.7l.5-3h-3.2V9.1c0-.9.3-1.6 1.6-1.6h1.7V4.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V11H7.5v3h2.9v8h3.1z"
        />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7.8 3h8.4C19 3 21 5 21 7.8v8.4c0 2.8-2 4.8-4.8 4.8H7.8C5 21 3 19 3 16.2V7.8C3 5 5 3 7.8 3zm0 1.8c-1.8 0-3 1.2-3 3v8.4c0 1.8 1.2 3 3 3h8.4c1.8 0 3-1.2 3-3V7.8c0-1.8-1.2-3-3-3H7.8zm8.9 1.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zM12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm0 1.8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
        />
      </svg>
    );
  }

  if (platform === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6.2 8.4a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM4.7 20V9.8h3V20h-3zm5 0V9.8h2.9v1.4h.1c.4-.8 1.4-1.7 2.9-1.7 3.1 0 3.7 2 3.7 4.7V20h-3v-4.9c0-1.2 0-2.6-1.6-2.6s-1.9 1.2-1.9 2.5V20h-3.1z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.9 3H22l-6.8 7.8L23 21h-6.2l-4.8-6.3L6.4 21H3.3l7.3-8.4L1 3h6.3l4.3 5.6L18.9 3zm-1.1 16h1.7L6.4 4.9H4.6L17.8 19z"
      />
    </svg>
  );
}

export default async function Footer() {
  const settings = await getResolvedPublicSiteSettings();
  const currentYear = new Date().getFullYear();
  const dialPhone = getDialPhone(settings.phone);
  const socialLinks = [
    { platform: "facebook" as const, href: settings.social.facebook, label: "Facebook" },
    { platform: "instagram" as const, href: settings.social.instagram, label: "Instagram" },
    { platform: "linkedin" as const, href: settings.social.linkedin, label: "LinkedIn" },
    { platform: "twitter" as const, href: settings.social.twitter, label: "X" },
  ].filter((item): item is { platform: SocialPlatform; href: string; label: string } => Boolean(item.href));

  return (
    <footer className="bg-[#1a1f2e] safe-area-bottom" role="contentinfo" aria-label="Site footer">
      <div className="mx-auto max-w-[1200px] px-4 xs:px-5 pt-9 xs:pt-10 md:px-10 md:pt-12">
        <div className="grid gap-7 xs:gap-8 sm:grid-cols-2 md:grid-cols-[1.1fr_0.8fr_0.8fr]">
          <div className="max-w-[280px] xs:max-w-[260px]">
            <div className="flex items-center gap-2">
              <span className="font-display text-[18px] xs:text-[20px] font-medium leading-[30px] tracking-[-0.01em] text-white">
                {settings.businessName}
              </span>
              <span className="h-[5px] w-[5px] rounded-full bg-[#b89a5e]" aria-hidden="true" />
            </div>

            <p className="mt-3.5 xs:mt-4 max-w-[240px] xs:max-w-[220px] text-[13px] xs:text-[13.5px] leading-[1.7] text-[rgba(255,255,255,0.45)]">
              Premium property management and real estate services in Electronic City, Bangalore.
              Trusted by 200+ families since 2014.
            </p>

            <address className="mt-4 xs:mt-5 space-y-2.5 text-[13px] not-italic leading-[19.5px] text-[rgba(255,255,255,0.6)]">
              <a 
                href={`tel:${dialPhone}`} 
                className="flex min-h-[36px] items-center gap-2.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e] touch-manipulation"
                aria-label={`Call us at ${settings.phoneDisplay}`}
              >
                <span className="material-symbols-outlined text-[14px] text-[#b89a5e]" aria-hidden="true">call</span>
                {settings.phoneDisplay}
              </a>
              <a 
                href={`mailto:${settings.email}`} 
                className="flex min-h-[36px] items-center gap-2.5 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e] touch-manipulation"
                aria-label={`Email us at ${settings.email}`}
              >
                <span className="material-symbols-outlined text-[14px] text-[#b89a5e]" aria-hidden="true">mail</span>
                {settings.email}
              </a>
              <p className="flex items-start gap-2.5 py-1.5">
                <span className="material-symbols-outlined mt-0.5 text-[14px] text-[#b89a5e]" aria-hidden="true">location_on</span>
                <span className="max-w-[220px]">{settings.address.full}</span>
              </p>
            </address>

            {socialLinks.length > 0 ? (
              <div className="mt-4 xs:mt-5 flex items-center gap-2" role="list" aria-label="Social media links">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Follow us on ${item.label}`}
                    role="listitem"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.55)] transition-colors hover:border-[rgba(212,184,122,0.5)] hover:text-[#d4b87a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e] touch-manipulation active:scale-95"
                  >
                    <SocialLogo platform={item.platform} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <nav aria-label="Company links">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b89a5e]">Company</h4>
            <ul className="mt-3.5 flex flex-col gap-0.5 text-[13px] leading-[19.5px] text-[rgba(255,255,255,0.55)]">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="inline-flex min-h-[36px] items-center transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e] touch-manipulation">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b89a5e]">Legal</h4>
            <ul className="mt-3.5 flex flex-col gap-0.5 text-[13px] leading-[19.5px] text-[rgba(255,255,255,0.55)]">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="inline-flex min-h-[36px] items-center transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e] touch-manipulation">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="mt-6 xs:mt-7 border-t border-[rgba(255,255,255,0.06)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 xs:px-5 py-3.5 text-[11px] xs:text-[12px] leading-[18px] text-[rgba(255,255,255,0.3)] sm:flex-row sm:items-center sm:justify-between md:px-10">
          <p>&copy; {currentYear} {settings.businessName}. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            <span className="h-[6px] w-[6px] rounded-full bg-[#b89a5e]/50" aria-hidden="true" />
            {settings.address.badge}
          </p>
        </div>
      </div>
    </footer>
  );
}