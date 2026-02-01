import { Suspense } from "react";
import ContactForm from "@/components/contact-form";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "Contact | Bathala Enterprises"
};

export default function ContactPage() {
  return (
    <div className="container-wide space-y-10">
      <header className="space-y-2 pt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-royal">Contact</p>
        <h1 className="text-4xl font-black text-slate-900">Connect with our team</h1>
        <p className="text-slateInk">Tell us about your project and timeline. We respond within one business day.</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Suspense fallback={<div className="glass-panel rounded-3xl p-6 shadow-xl animate-pulse h-96" />}>
          <ContactForm />
        </Suspense>
        <div className="glass-panel rounded-3xl p-6 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-royal">Visit</p>
          <h3 className="text-xl font-black text-slate-900">Head office</h3>
          <p className="text-slateInk">{siteConfig.address.full}</p>
          <div className="mt-4 overflow-hidden rounded-2xl">
            <iframe
              title="Bathala HQ"
              src={siteConfig.mapEmbedUrl}
              className="h-72 w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}