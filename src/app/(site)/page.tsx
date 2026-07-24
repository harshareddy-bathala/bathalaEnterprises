import dynamic from "next/dynamic";
import {
  getFeaturedTestimonials,
  getPropertiesFromSupabase,
  getServicesFromSupabase,
  getTestimonialsFromSupabase,
} from "@/lib/supabase-queries";
import { JsonLd } from "@/components/json-ld";
import { generateWebPageSchema, generateBreadcrumbSchema } from "@/lib/structured-data";
import type { Testimonial } from "@/types/tables";

const Hero = dynamic(() => import("@/components/hero"), {
  ssr: true,
  loading: () => <div className="h-[420px] w-full bg-[#f8f6f2]" aria-hidden="true" />,
});

const TrustBar = dynamic(() => import("@/components/trust-bar"), {
  ssr: true,
  loading: () => <div className="h-24 w-full bg-[#2c3340]" aria-hidden="true" />,
});

const ServicesGrid = dynamic(() => import("@/components/services-grid"), {
  ssr: true,
  loading: () => <div className="h-[360px] w-full bg-white" aria-hidden="true" />,
});

const PropertiesCarousel = dynamic(() => import("@/components/properties-carousel"), {
  ssr: true,
  loading: () => <div className="h-[360px] w-full bg-[#f8f6f2]" aria-hidden="true" />,
});

const TestimonialsSection = dynamic<{ testimonials: Testimonial[] }>(() => import("@/components/testimonials-section"), {
  ssr: true,
  loading: () => <div className="h-[300px] w-full bg-white" aria-hidden="true" />,
});

const CtaSection = dynamic(() => import("@/components/cta-section"), {
  ssr: true,
  loading: () => <div className="h-[240px] w-full bg-[#f8f6f2]" aria-hidden="true" />,
});

export const revalidate = 60; // ISR: revalidate every 60 seconds

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com";

export default async function HomePage() {
  const [services, properties, featuredTestimonials] = await Promise.all([
    getServicesFromSupabase(),
    getPropertiesFromSupabase(false),
    getFeaturedTestimonials(),
  ]);

  let homepageTestimonials = featuredTestimonials;
  if (homepageTestimonials.length === 0) {
    const latestTestimonials = await getTestimonialsFromSupabase();
    homepageTestimonials = latestTestimonials.slice(0, 3);
  }

  const webPageSchema = generateWebPageSchema(
    baseUrl,
    "Bathala Enterprises | Premium Real Estate Services in Bangalore",
    "Premium real estate services, property management, and advisory in Bangalore. Find properties for rent, lease, and sale in Electronic City."
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl }
  ]);

  return (
    <div>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      
      {/* Hero */}
      <div id="home">
        <Hero />
      </div>

      {/* Trust Bar */}
      <TrustBar />

      {/* Services */}
      <ServicesGrid services={services} limit={3} showViewAll />

      {/* Properties */}
      <PropertiesCarousel properties={properties} />

      {/* Testimonials */}
      <TestimonialsSection testimonials={homepageTestimonials} />

      {/* CTA */}
      <CtaSection />
    </div>
  );
}