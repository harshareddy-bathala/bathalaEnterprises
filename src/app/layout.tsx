import type { Metadata, Viewport } from "next";
import { Inter, Patua_One, Great_Vibes } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const patua = Patua_One({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-patua" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-greatvibes" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7C3AED",
};

export const metadata: Metadata = {
  title: {
    default: "Bathala Enterprises | Premium Real Estate Services in Bangalore",
    template: "%s | Bathala Enterprises"
  },
  description: "Bathala Enterprises offers premium real estate services, property management, and advisory in Bangalore. 15+ years of trusted experience with 500+ properties. Building trust, one property at a time.",
  keywords: ["real estate", "Bangalore", "property management", "rental properties", "property sale", "lease", "real estate advisory", "property services", "Bathala Enterprises"],
  authors: [{ name: "Bathala Enterprises" }],
  creator: "Bathala Enterprises",
  publisher: "Bathala Enterprises",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "Bathala Enterprises | Premium Real Estate Services in Bangalore",
    description: "Bathala Enterprises offers premium real estate services, property management, and advisory in Bangalore. Building trust, one property at a time.",
    siteName: "Bathala Enterprises",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bathala Enterprises - Premium Real Estate Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bathala Enterprises | Premium Real Estate in Bangalore",
    description: "Premium real estate services, property management, and advisory in Bangalore.",
    images: ["/og-image.jpg"],
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
    icon: new URL("../favicon_io/favicon.ico", import.meta.url).toString(),
    shortcut: new URL("../favicon_io/favicon-16x16.png", import.meta.url).toString(),
    apple: new URL("../favicon_io/apple-touch-icon.png", import.meta.url).toString(),
  },
  manifest: new URL("../favicon_io/site.webmanifest", import.meta.url).toString(),
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-50">
      <body
        className={cn("min-h-screen text-slate-900 font-sans", inter.variable, patua.variable, greatVibes.variable, "relative")}
      >
        <div className="absolute inset-0 -z-10 bg-glass-blur" aria-hidden />
        <Navbar brandFont={patua} scriptFont={greatVibes} />
        <main className="pt-20 pb-12">{children}</main>
        <Footer />
      </body>
    </html>
  );
}