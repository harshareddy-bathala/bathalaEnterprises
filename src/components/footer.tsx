import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-slate-200/60 bg-gradient-to-b from-white/80 to-purple/5 backdrop-blur">
      <div className="container-wide py-12">
        <div className="grid gap-8 mb-8 md:grid-cols-4">
          <div className="space-y-4">
            <p className="text-lg font-black text-royal uppercase tracking-wide">{siteConfig.businessName}</p>
            <p className="text-sm text-slateInk">{siteConfig.tagline} Your trusted partner for premium real estate services in Bangalore.</p>
            <div className="flex items-center gap-2 text-sm text-slateInk">
              <Clock className="h-4 w-4 text-royal" />
              <span>{siteConfig.hours.weekdays}</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Quick Links</p>
            <div className="space-y-2 text-sm">
              <Link href="/" className="block text-slateInk hover:text-royal transition">
                Home
              </Link>
              <Link href="/all-properties" className="block text-slateInk hover:text-royal transition">
                Properties
              </Link>
              <Link href="/services" className="block text-slateInk hover:text-royal transition">
                Services
              </Link>
              <Link href="/contact" className="block text-slateInk hover:text-royal transition">
                Contact
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Contact Info</p>
            <div className="space-y-3 text-sm">
              <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-slateInk hover:text-royal transition">
                <Phone className="h-4 w-4" />
                {siteConfig.contact.phoneDisplay}
              </a>
              <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-2 text-slateInk hover:text-royal transition">
                <Mail className="h-4 w-4" />
                {siteConfig.contact.email}
              </a>
              <div className="flex items-start gap-2 text-slateInk">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{siteConfig.address.full}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Legal & Admin</p>
            <div className="space-y-2 text-sm">
              <Link href="/privacy" className="block text-slateInk hover:text-royal transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-slateInk hover:text-royal transition">
                Terms of Service
              </Link>
              <Link href="/admin/login" className="block text-slateInk hover:text-royal transition">
                Admin Console
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200/60 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slateInk">
          <p>© {currentYear} {siteConfig.businessName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}