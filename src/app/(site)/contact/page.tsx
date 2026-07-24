import Link from "next/link";
import type { Metadata } from "next";
import ContactForm from "@/components/contact-form";
import { JsonLd } from "@/components/json-ld";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/structured-data";
import { getResolvedPublicSiteSettings } from "@/lib/public-site-settings";

export const metadata: Metadata = {
  title: "Contact | Bathala Enterprises",
  description:
    "Reach Bathala Enterprises for property rentals, sales, leasing and management support in Electronic City, Bengaluru.",
  alternates: {
    canonical: "/contact",
  },
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com";

type ContactPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const queryTypeRaw =
    typeof resolvedSearchParams.query_type === "string"
      ? resolvedSearchParams.query_type
      : undefined;
  const queryType = queryTypeRaw === "properties" || queryTypeRaw === "services"
    ? queryTypeRaw
    : undefined;
  const serviceType =
    typeof resolvedSearchParams.service_type === "string"
      ? resolvedSearchParams.service_type
      : undefined;
  const propertyId =
    typeof resolvedSearchParams.property_id === "string"
      ? resolvedSearchParams.property_id
      : undefined;
  const propertyTitle =
    typeof resolvedSearchParams.property_title === "string"
      ? resolvedSearchParams.property_title
      : undefined;
  const propertyType =
    typeof resolvedSearchParams.property_type === "string"
      ? resolvedSearchParams.property_type
      : undefined;
  const settings = await getResolvedPublicSiteSettings();
  const dialPhone = settings.phone.replace(/\s/g, "");

  const socialLinksRaw: Array<{ label: string; href: string } | null> = [
    settings.social.instagram ? { label: "Instagram", href: settings.social.instagram } : null,
    settings.social.linkedin ? { label: "LinkedIn", href: settings.social.linkedin } : null,
    settings.social.facebook ? { label: "Facebook", href: settings.social.facebook } : null,
    settings.social.twitter ? { label: "X", href: settings.social.twitter } : null,
  ];

  const socialLinks = socialLinksRaw.filter((item) => item !== null) as Array<{ label: string; href: string }>;

  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/contact`,
    "Contact | Bathala Enterprises",
    "Reach Bathala Enterprises for property rentals, sales, leasing and management support in Electronic City, Bengaluru."
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Contact", url: `${baseUrl}/contact` },
  ]);

  return (
    <div className="bathala-page pb-0">
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <section className="relative overflow-hidden bg-[#1a1f2e]">
        <div className="pointer-events-none absolute -right-16 -top-16 hidden h-[260px] w-[260px] rounded-full bg-[rgba(184,154,94,0.06)] sm:block md:-right-20 md:-top-20 md:h-[320px] md:w-[320px]" />
        <div className="pointer-events-none absolute -left-6 -bottom-20 hidden h-[180px] w-[180px] rounded-full bg-[rgba(184,154,94,0.04)] sm:block md:-left-8 md:bottom-[-90px] md:h-[210px] md:w-[210px]" />

        <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-10 md:px-10 md:pb-20 md:pt-14">
          <div className="flex items-center gap-2">
            <span className="h-[1.5px] w-6 rounded-[2px] bg-[#b89a5e]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">Contact Us</p>
          </div>

          <h1 className="mt-4 max-w-[560px] font-display text-[clamp(2.2rem,7vw,52px)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
            We&apos;re here to help you find your place.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-20 pt-16 md:px-10 md:pt-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:gap-16">
          <div id="contact-details" className="scroll-mt-[92px]">
            <div className="flex items-center gap-2">
              <span className="h-[1.5px] w-6 rounded-[2px] bg-[#b89a5e]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">Get in Touch</p>
            </div>

            <h2 className="mt-4 max-w-[500px] font-display text-[clamp(2rem,6vw,45px)] font-bold leading-[1.12] tracking-[-0.02em] text-[#1a1f2e]">
              Let&apos;s Find the Right <span className="italic text-[#4a5568]">Property</span> for You
            </h2>

            <p className="mt-4 max-w-[420px] text-[15px] leading-[1.7] text-[#6b7280]">
              Whether you&apos;re searching for your dream home, a smart investment, or reliable property care,
              our team is here to guide you every step of the way.
            </p>

            <div className="mt-10 h-[1.5px] w-12 rounded-[2px] bg-[#e8e4dc]" />

            <div className="mt-9 space-y-7">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[rgba(184,154,94,0.18)] bg-[rgba(184,154,94,0.08)]">
                  <span className="material-symbols-outlined text-[18px] text-[#b89a5e]">call</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b89a5e]">Phone</p>
                  <div className="mt-1">
                    <a href={`tel:${dialPhone}`} className="text-[14.5px] font-medium text-[#1a1f2e] transition-colors hover:text-[#b89a5e]">
                      {settings.phoneDisplay}
                    </a>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-[#9ca3af]">Call or WhatsApp us any time</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[rgba(184,154,94,0.18)] bg-[rgba(184,154,94,0.08)]">
                  <span className="material-symbols-outlined text-[18px] text-[#b89a5e]">mail</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b89a5e]">Email</p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="mt-1 block text-[14.5px] font-medium text-[#1a1f2e] transition-colors hover:text-[#b89a5e]"
                  >
                    {settings.email}
                  </a>
                  <p className="mt-0.5 text-[12.5px] text-[#9ca3af]">We reply within 2 business hours</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[rgba(184,154,94,0.18)] bg-[rgba(184,154,94,0.08)]">
                  <span className="material-symbols-outlined text-[18px] text-[#b89a5e]">location_on</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b89a5e]">Office</p>
                  <p className="mt-1 text-[14.5px] font-medium text-[#1a1f2e]">{settings.address.compact}</p>
                  <p className="mt-0.5 text-[12.5px] text-[#9ca3af]">{settings.address.full}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[rgba(184,154,94,0.18)] bg-[rgba(184,154,94,0.08)]">
                  <span className="material-symbols-outlined text-[18px] text-[#b89a5e]">schedule</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b89a5e]">Office Hours</p>
                  <p className="mt-1 text-[14.5px] font-medium text-[#1a1f2e]">{settings.hours.weekdays}</p>
                  <p className="mt-0.5 text-[12.5px] text-[#9ca3af]">{settings.hours.sunday} on Sundays and public holidays</p>
                </div>
              </div>
            </div>

            <div className="relative mt-10 overflow-hidden rounded-[16px] border border-[#ede8df] bg-[#ede8d8]">
              <iframe
                title="Bathala HQ"
                src={settings.mapEmbedUrl}
                className="h-[220px] w-full border-0 md:h-[250px]"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgba(248,246,242,0.85)] to-transparent" />

              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(255,255,255,0.92)] px-4 py-[6px] text-[11.5px] font-semibold text-[#1a1f2e] shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
                {settings.address.badge}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 text-[12px] text-[#9ca3af]">
              <span>Also reach us on</span>
              {socialLinks.length > 0 ? (
                socialLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="border-b border-[#e8e4dc] font-semibold text-[#4a5568] transition-colors hover:text-[#1a1f2e]"
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                <a
                  href={`mailto:${settings.email}`}
                  className="border-b border-[#e8e4dc] font-semibold text-[#4a5568] transition-colors hover:text-[#1a1f2e]"
                >
                  Email
                </a>
              )}
            </div>
          </div>

          <div id="inquiry-form" className="scroll-mt-[92px]">
            <ContactForm
              initialPropertyId={propertyId}
              initialPropertyTitle={propertyTitle}
              initialPropertyType={propertyType}
              initialQueryType={queryType}
              initialServiceType={serviceType}
            />
          </div>
        </div>
      </section>
    </div>
  );
}