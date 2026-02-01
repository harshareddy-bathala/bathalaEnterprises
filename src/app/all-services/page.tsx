"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BriefcaseBusiness, ShieldCheck, Sparkles, Wrench, Home, Building, Key, Users, FileText, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Service } from "@/lib/supabase-queries";
import { getServicesFromSupabase } from "@/lib/supabase-queries";

const iconMap = {
  ShieldCheck,
  Wrench,
  Sparkles,
  BriefcaseBusiness,
  Home,
  Building,
  Key,
  Users,
  FileText,
  Landmark
};

export default function AllServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      const data = await getServicesFromSupabase();
      setServices(data);
      setLoading(false);
    };
    loadServices();
  }, []);

  const ServiceCard = ({ service, idx }: { service: Service; idx: number }) => {
    const iconName = (service.icon_name || service.icon || "Sparkles") as string;
    const Icon = iconMap[iconName as keyof typeof iconMap] ?? Sparkles;

    return (
      <motion.div
        key={service.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="animate-slide-up"
        style={{ animationDelay: `${idx * 0.05}s` }}
      >
        <Card className="group h-full border border-white/60 transition-all duration-300 hover:shadow-glow hover:border-purple/50">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-royal/10 to-purple/10 p-3 text-royal transition-all group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-royal/30">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>{service.title}</CardTitle>
              {service.price_range && (
                <CardDescription className="mt-1 font-semibold text-slate-900">
                  {service.price_range}
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slateInk">{service.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pt-32 pb-16">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-2"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-royal">
            Services
          </p>
          <h1 className="text-4xl font-black text-slate-900">All Services</h1>
          <p className="text-lg text-slateInk">
            Explore our complete range of {services.length} premium real estate services.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal"></div>
          </div>
        ) : (
          <>
            {/* Services Grid */}
            <motion.div
              layout
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {services.map((service, idx) => (
                <ServiceCard key={service.id} service={service} idx={idx} />
              ))}
            </motion.div>

            {/* Empty State */}
            {services.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-lg text-slateInk">No services available at the moment.</p>
              </motion.div>
            )}
          </>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex justify-center"
        >
          <Link href="/#services">
            <Button variant="ghost" size="lg">
              ← Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
