import Hero from "@/components/hero";
import ServicesGrid from "@/components/services-grid";
import PropertiesCarousel from "@/components/properties-carousel";
import ContactForm from "@/components/contact-form";
import ChatbotWidget from "@/components/chatbot-widget";
import { getServicesFromSupabase, getPropertiesFromSupabase } from "@/lib/supabase-queries";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const [services, properties] = await Promise.all([
    getServicesFromSupabase(),
    getPropertiesFromSupabase(),
  ]);

  return (
    <div className="space-y-16">
      {/* Home Hero Section */}
      <div id="home">
        <Hero />
      </div>

      {/* Services Section */}
      <ServicesGrid services={services} />

      {/* Properties Section */}
      <PropertiesCarousel properties={properties} />

      {/* Contact Section */}
      <section id="contact" className="container-wide">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <ContactForm />
          <div className="glass-panel rounded-3xl p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-royal">Visit</p>
            <h3 className="text-xl font-black text-slate-900">Head office</h3>
            <p className="text-slateInk">Chikkapatre Main Road, 5th Cross, Basapura, Bangalore 560100</p>
            <div className="mt-4 overflow-hidden rounded-2xl">
              <iframe
                title="Bathala HQ"
                src="https://maps.google.com/maps?q=basapura,bangalore&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="h-64 w-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <ChatbotWidget />
    </div>
  );
}