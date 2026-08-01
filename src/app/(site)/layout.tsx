import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ChatbotDeferred from "@/components/chatbot-deferred";
import PwaInstallPrompt from "@/components/pwa-install-prompt";
import PageTransition from "@/components/page-transition";
import ConnectionStatusIndicator from "@/components/connection-status-indicator";
import { JsonLd } from "@/components/json-ld";
import { generateOrganizationSchema, generateLocalBusinessSchema } from "@/lib/structured-data";
import { getResolvedPublicSiteSettings } from "@/lib/public-site-settings";
import { getTestimonialsFromSupabase } from "@/lib/supabase-queries";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  // Both reads are React.cache()d, so this shares the round-trip the Footer
  // already makes rather than adding one.
  const [settings, testimonials] = await Promise.all([
    getResolvedPublicSiteSettings(),
    getTestimonialsFromSupabase(),
  ]);

  const ratings =
    testimonials.length > 0
      ? {
          ratingValue:
            testimonials.reduce((sum, item) => sum + item.rating, 0) / testimonials.length,
          reviewCount: testimonials.length,
        }
      : undefined;

  const organizationSchema = generateOrganizationSchema(settings, ratings);
  const localBusinessSchema = generateLocalBusinessSchema(settings);

  return (
    <div className="bathala-shell relative flex min-h-screen w-full flex-col overflow-x-hidden [overscroll-behavior-y:none] safe-area-inset">
      {/* Skip Link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[#b89a5e] focus:px-4 focus:py-2 focus:text-[#2c3340] focus:outline-none"
      >
        Skip to main content
      </a>
      
      {/* Structured Data */}
      <JsonLd data={organizationSchema} />
      <JsonLd data={localBusinessSchema} />
      
      <Navbar />
      <main
        id="main-content"
        className="flex-1 min-w-0 overflow-x-clip [overscroll-behavior-y:contain] [touch-action:pan-y] mobile-scroll"
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <ConnectionStatusIndicator />
      <PwaInstallPrompt />
      <ChatbotDeferred />
    </div>
  );
}