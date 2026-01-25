"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const handleScrollClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="container-wide mt-8 grid gap-10 overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-white/70 to-purple/5 px-6 py-16 shadow-xl sm:grid-cols-2 sm:items-center">
      <div className="space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-sm font-semibold uppercase tracking-[0.2em] text-royal"
        >
          Bathala Enterprises
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-black leading-tight gradient-title sm:text-5xl"
        >
          Building Trust, One Property at a Time
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-xl text-lg text-slateInk"
        >
          Exceptional property services, advisory, and management delivered with precision, transparency, and a
          commitment to long-term partnerships across Bangalore.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-3">
          <Button size="lg" variant="primary" onClick={() => handleScrollClick("properties")}>
            Explore Properties
          </Button>
          <Button size="lg" variant="accent" onClick={() => handleScrollClick("contact")}>
            Book a Consultation
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-6 text-sm text-slateInk"
        >
          <div>
            <p className="font-bold text-slate-900">15+ years</p>
            <p>Industry leadership</p>
          </div>
          <div>
            <p className="font-bold text-slate-900">500+ Properties</p>
            <p>Across Bangalore</p>
          </div>
          <div>
            <p className="font-bold text-slate-900">24/7</p>
            <p>Dedicated support</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18 }}
        className="relative h-full"
      >
        <div className="glass-panel relative h-full w-full overflow-hidden rounded-3xl shadow-2xl shadow-purple/20">
          <img
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80"
            alt="Modern property"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-purple/40 via-transparent to-amberGlow/20" />
        </div>
      </motion.div>
    </section>
  );
}