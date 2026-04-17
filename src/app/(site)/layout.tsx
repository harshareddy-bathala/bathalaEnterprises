import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ChatbotDeferred from "@/components/chatbot-deferred";
import PwaInstallPrompt from "@/components/pwa-install-prompt";
import PageTransition from "@/components/page-transition";
import ConnectionStatusIndicator from "@/components/connection-status-indicator";
import { JsonLd } from "@/components/json-ld";
import { generateOrganizationSchema, generateLocalBusinessSchema } from "@/lib/structured-data";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const organizationSchema = generateOrganizationSchema();
  const localBusinessSchema = generateLocalBusinessSchema();

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