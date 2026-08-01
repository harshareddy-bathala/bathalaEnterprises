import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import {
  generateBreadcrumbSchema,
  generateFaqSchema,
  generateWebPageSchema,
} from "@/lib/structured-data";
import { FAQ_ENTRIES } from "@/lib/faq-content";
import { cn } from "@/lib/utils";
import { buildMetadata, siteUrl as baseUrl } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "Learn about Bathala Enterprises, our values, journey, and what makes our property services trusted by families across Electronic City, Bangalore.",
  path: "/about",
});

const trustStats = [
  { value: "50+", label: "Properties Managed" },
  { value: "200+", label: "Happy Families" },
  { value: "10+", label: "Years of Experience" },
  { value: "98%", label: "Client Satisfaction" },
] as const;

const values = [
  {
    icon: "shield",
    title: "Trust and Transparency",
    description:
      "Every transaction is built on honesty. We share complete documentation, fair pricing, and fully compliant processes.",
  },
  {
    icon: "diversity_3",
    title: "Client First",
    description:
      "Your needs drive every decision we make. We listen, understand, and deliver beyond expectations.",
  },
  {
    icon: "workspace_premium",
    title: "Quality Assurance",
    description:
      "Every property is personally vetted. We never list anything we would not recommend to our own family.",
  },
  {
    icon: "location_city",
    title: "Local Expertise",
    description:
      "Deep knowledge of Electronic City's micro-markets, pricing trends, and upcoming developments.",
  },
] as const;

const journey = [
  {
    year: "2014",
    title: "Founded",
    description:
      "Started with a vision to bring transparency to Electronic City's rental market.",
  },
  {
    year: "2017",
    title: "100+ Properties",
    description:
      "Crossed 100 managed properties and expanded into property sales.",
  },
  {
    year: "2020",
    title: "Full-Service Model",
    description:
      "Added maintenance, electrical, plumbing, and security services.",
  },
  {
    year: "2024",
    title: "200+ Happy Families",
    description:
      "Became one of the most trusted property management firms in Electronic City.",
  },
] as const;

const differentiators = [
  "Fully compliant and verified operations",
  "Personally vetted properties with no middlemen",
  "24/7 maintenance and support services",
  "Transparent pricing with no hidden charges",
  "Dedicated relationship manager for every client",
  "10+ years of deep Electronic City expertise",
] as const;

export default function AboutPage() {
  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/about`,
    "About Us | Bathala Enterprises",
    "Learn about Bathala Enterprises, our values, journey, and what makes our property services trusted by families across Electronic City, Bangalore."
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "About", url: `${baseUrl}/about` },
  ]);

  return (
    <div className="bathala-page pb-24 pt-14 sm:pt-16">
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={generateFaqSchema(FAQ_ENTRIES)} />
      <section className="mx-auto max-w-[1200px] px-5 md:px-10">
        <div className="flex items-center gap-2">
          <span className="h-[1.5px] w-8 rounded-[2px] bg-[#b89a5e]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">About Us</p>
        </div>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <h1 className="font-display text-[clamp(2.1rem,6vw,52px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#1a1f2e]">
              Building Trust in <span className="italic text-[#4a5568]">Real Estate</span> Since 2014
            </h1>

            <p className="mt-5 text-[15px] leading-[1.8] text-[#6b7280] sm:text-[16px]">
              Bathala Enterprises was founded with a simple belief: real estate should be transparent,
              fair, and stress-free. Based in Electronic City, Bangalore, we have grown from a small
              rental management firm to a full-service property company trusted by hundreds of families.
            </p>

            <p className="mt-5 text-[15px] leading-[1.8] text-[#6b7280] sm:text-[16px]">
              Our team combines deep local expertise with a commitment to quality that sets us apart.
              Every property we manage is treated as if it were our own.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[20px] border border-[#e8e4dc] bg-[#e8e4dc] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <Image
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80"
              alt="Bathala team meeting clients"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="h-[280px] w-full sm:h-[360px]" />
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[16px] border border-[#e8e4dc] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="grid sm:grid-cols-2 md:grid-cols-4">
            {trustStats.map((item, idx) => (
              <div
                key={item.label}
                className={cn(
                  "px-6 py-7 text-center",
                  idx < trustStats.length - 1 && "border-b border-[#f0ede7] sm:border-r sm:border-b-0",
                  idx % 2 === 0 && idx < trustStats.length - 2 && "md:border-r"
                )}
              >
                <p className="font-display text-[32px] font-bold tracking-[-0.02em] text-[#1a1f2e]">{item.value}</p>
                <p className="mt-1 text-[12px] tracking-[0.02em] text-[#9ca3af]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1.5px] w-8 rounded-[2px] bg-[#b89a5e]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">Our Values</p>
              <span className="h-[1.5px] w-8 rounded-[2px] bg-[#b89a5e]" />
            </div>

            <h2 className="mt-4 font-display text-[clamp(1.9rem,5vw,40px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#1a1f2e]">
              What Drives <span className="italic text-[#4a5568]">Us</span>
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map((value, idx) => (
              <article
                key={value.title}
                className={cn(
                  "rounded-[16px] border border-[#f0ede7] bg-[#fdfcfa] px-6 pb-7 pt-8",
                  idx === 3 && "md:col-span-1"
                )}
              >
                <div className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-[rgba(184,154,94,0.18)] bg-[rgba(184,154,94,0.08)]">
                  <span className="material-symbols-outlined text-[22px] text-[#b89a5e]" aria-hidden="true">{value.icon}</span>
                </div>
                <h3 className="mt-5 font-display text-[22px] font-semibold leading-[1.2] text-[#1a1f2e]">
                  {value.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#6b7280]">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1200px] px-5 md:px-10">
        <div className="flex items-center gap-2">
          <span className="h-[1.5px] w-8 rounded-[2px] bg-[#b89a5e]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">Our Journey</p>
        </div>

        <h2 className="mt-3 font-display text-[clamp(1.9rem,5vw,40px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#1a1f2e]">
          A Decade of <span className="italic text-[#4a5568]">Growth</span>
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {journey.slice(0, 3).map((milestone) => (
            <article key={milestone.year} className="rounded-[16px] border border-[#e8e4dc] bg-white px-7 pb-7 pt-7">
              <p className="font-display text-[24px] font-bold text-[#b89a5e]">{milestone.year}</p>
              <h3 className="mt-2 text-[16px] font-semibold text-[#1a1f2e]">{milestone.title}</h3>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-[#6b7280]">{milestone.description}</p>
            </article>
          ))}
          <article className="rounded-[16px] border border-[#e8e4dc] bg-white px-7 pb-7 pt-7 md:col-span-1">
            <p className="font-display text-[24px] font-bold text-[#b89a5e]">{journey[3].year}</p>
            <h3 className="mt-2 text-[16px] font-semibold text-[#1a1f2e]">{journey[3].title}</h3>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-[#6b7280]">{journey[3].description}</p>
          </article>
        </div>
      </section>

      <section className="mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 md:px-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div className="relative overflow-hidden rounded-[20px] border border-[#e8e4dc] bg-[#e8e4dc] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <Image
              src="https://images.unsplash.com/photo-1617104551722-3b2d51366400?auto=format&fit=crop&w=1200&q=80"
              alt="Premium interior managed by Bathala"
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="h-[280px] w-full sm:h-[360px]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="h-[1.5px] w-6 rounded-[2px] bg-[#b89a5e]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b89a5e]">Why Choose Us</p>
            </div>

            <h2 className="mt-3 font-display text-[clamp(1.9rem,5vw,40px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#1a1f2e]">
              The Bathala <span className="italic text-[#4a5568]">Difference</span>
            </h2>

            <ul className="mt-7 space-y-4">
              {differentiators.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14.5px] leading-[1.5] text-[#4a5568]">
                  <span className="mt-[1px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d9c492] text-[#b89a5e]">
                    <span className="material-symbols-outlined text-[12px]" aria-hidden="true">check</span>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/contact"
              className="mt-8 inline-flex h-[47px] items-center gap-2 rounded-[10px] bg-[#b89a5e] px-7 text-[14px] font-semibold text-[#2c3340] transition-colors hover:bg-[#a88c52]"
            >
              Contact Us
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}