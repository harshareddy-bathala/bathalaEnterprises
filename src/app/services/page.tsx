import { Metadata } from "next";
import ServicesGrid from "@/components/services-grid";
import { getServicesFromSupabase } from "@/lib/supabase-queries";

export const metadata: Metadata = {
  title: "Services",
  description: "Explore Bathala Enterprises' premium real estate services including property management, advisory, valuation, and tenant relations in Bangalore.",
};

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function ServicesPage() {
  const services = await getServicesFromSupabase();

  return (
    <div className="space-y-10 pt-4">
      <header className="container-wide space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-royal">Services</p>
        <h1 className="text-4xl font-black text-slate-900">Our services</h1>
        <p className="text-slateInk">Comprehensive real estate solutions for your needs.</p>
      </header>
      <ServicesGrid services={services} />
    </div>
  );
}