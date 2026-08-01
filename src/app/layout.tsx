import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE_NAME, siteUrl } from "@/lib/seo";
import AnalyticsTracking from "@/components/analytics-tracking";
import RumMonitor from "@/components/rum-monitor";

// Optimized font loading with subset and display strategy
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  display: "optional",
  variable: "--font-display",
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#b89a5e",
};

export const metadata: Metadata = {
  applicationName: "Bathala Enterprises",
  title: {
    default: "Bathala Enterprises | Premium Real Estate Services in Bangalore",
    template: "%s | Bathala Enterprises"
  },
  description: "Bathala Enterprises offers premium real estate services, property management, and advisory in Bangalore. 15+ years of trusted experience with 500+ properties. Building trust, one property at a time.",
  keywords: ["real estate", "Bangalore", "property management", "rental properties", "property sale", "lease", "real estate advisory", "property services", "Bathala Enterprises"],
  authors: [{ name: "Bathala Enterprises" }],
  creator: "Bathala Enterprises",
  publisher: "Bathala Enterprises",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
    },
  },
  // Open Graph / Twitter images come from the `opengraph-image.tsx` file
  // convention (root + per-route), so they are deliberately not set here.
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "Bathala Enterprises | Premium Real Estate Services in Bangalore",
    description: "Bathala Enterprises offers premium real estate services, property management, and advisory in Bangalore. Building trust, one property at a time.",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bathala Enterprises | Premium Real Estate in Bangalore",
    description: "Premium real estate services, property management, and advisory in Bangalore.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  appleWebApp: {
    capable: true,
    title: "Bathala",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const rumEnabled =
    process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_RUM !== "false";

  return (
    // en-IN matches metadata.alternates.languages and site.webmanifest
    <html lang="en-IN" className="bg-[var(--color-background)]">
      <head>
        {process.env.NODE_ENV !== "production" ? (
          <Script id="dev-sw-cleanup" src="/dev-sw-cleanup.js" strategy="beforeInteractive" />
        ) : null}

        {/* Preconnect to critical external domains */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        
        {/* Preconnect to Supabase for data fetching */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        
        {/* Preload Material Symbols font to prevent FOUT (Flash of Unstyled Text) */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/materialsymbolsoutlined/v205/kJEhBvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oFsI.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* iOS startup splash fallbacks */}
        <link rel="apple-touch-startup-image" href="/android-chrome-512x512.png" />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
          href="/android-chrome-512x512.png"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans antialiased selection:bg-primary selection:text-[var(--color-slate-primary)]",
          inter.variable,
          playfair.variable,
          "relative"
        )}
      >
        {children}
        <Suspense fallback={null}>
          <AnalyticsTracking measurementId={gaMeasurementId} />
        </Suspense>
        <Suspense fallback={null}>
          <RumMonitor enabled={rumEnabled} endpoint="/api/rum" />
        </Suspense>
      </body>
    </html>
  );
}
