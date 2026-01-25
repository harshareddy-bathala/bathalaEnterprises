"use client";

import { useState } from "react";
import { BriefcaseBusiness, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/supabase-queries";
import Modal from "@/components/modal";

const iconMap = {
  ShieldCheck,
  Wrench,
  Sparkles,
  BriefcaseBusiness
};

export default function ServicesGrid({ services }: { services: Service[] }) {
  const [showModal, setShowModal] = useState(false);
  const displayedServices = services.slice(0, 6);
  const hasMore = services.length > 6;

  const ServiceCard = ({ service, idx }: { service: Service; idx: number }) => {
    // Map icon names or use fallback
    const iconName = (service.icon_name || service.icon || "Sparkles") as string;
    const Icon = iconMap[iconName as keyof typeof iconMap] ?? Sparkles;
    
    return (
      <motion.div
        key={service.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
        className="animate-slide-up"
        style={{ animationDelay: `${idx * 0.1}s` }}
      >
        <Card className="group h-full border border-white/60 transition-all duration-300 hover:shadow-glow hover:border-purple/50">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-royal/10 to-purple/10 p-3 text-royal transition-all group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-royal/30">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>{service.title}</CardTitle>
              <CardDescription className="mt-1 font-semibold text-slate-900">{service.price_range}</CardDescription>
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
    <>
      <section id="services" className="container-wide py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-royal">Services</p>
            <h2 className="text-3xl font-black text-slate-900">Premium Solutions</h2>
            <p className="text-slateInk">Comprehensive service lines tailored to your needs.</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {displayedServices.map((service, idx) => (
            <ServiceCard key={service.id} service={service} idx={idx} />
          ))}
        </div>

        {/* View More Button */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex justify-center"
          >
            <Button
              onClick={() => setShowModal(true)}
              size="lg"
              className="bg-gradient-to-r from-royal to-purple hover:shadow-glow"
            >
              View All Services
            </Button>
          </motion.div>
        )}
      </section>

      {/* Modal for All Services */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="All Services"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, idx) => (
            <ServiceCard key={service.id} service={service} idx={idx} />
          ))}
        </div>
      </Modal>
    </>
  );
}