"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { PropertyType } from "@/types/tables";
import type { Property } from "@/lib/supabase-queries";

const typeFilters: { label: string; value?: PropertyType }[] = [
  { label: "All", value: undefined },
  { label: "Rent", value: "Rent" },
  { label: "Lease", value: "Lease" },
  { label: "Sale", value: "Sale" }
];

export default function PropertiesCarousel({ properties }: { properties: Property[] }) {
  const [active, setActive] = useState<PropertyType | undefined>(undefined);

  const filtered = useMemo(() => properties.filter((p) => (active ? p.type === active : true)), [properties, active]);
  const displayedProperties = filtered.slice(0, 6);
  const hasMore = filtered.length > 6;

  const PropertyCard = ({ property, idx }: { property: Property; idx: number }) => (
    <motion.div
      key={property.id}
      layout
      whileHover={{ y: -6 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
    >
      <Link href={`/properties/${property.id}`}>
        <Card className="group h-full overflow-hidden border border-white/70 transition-all duration-300 cursor-pointer hover:shadow-glow hover:border-purple/50">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={property.thumbnail_url || property.image_url}
              alt={property.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            <div className="absolute left-3 top-3 flex gap-2">
              <Badge className="bg-white/90 text-slate-900 font-semibold">{property.type.toUpperCase()}</Badge>
            </div>
          </div>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-xl text-slate-900 group-hover:text-royal transition-colors">{property.title}</CardTitle>
            <p className="text-sm font-semibold text-royal">{property.location}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slateInk">
              <span>{property.bedrooms} beds</span>
              <span>{formatNumber(property.sqft)} sqft</span>
              <span className="font-semibold text-slate-900">
                ₹{formatNumber(property.price)}{property.type === "Rent" ? "/mo" : property.type === "Lease" ? "/yr" : ""}
              </span>
            </div>
            <Button variant="secondary" className="w-full">
              View details
            </Button>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <>
      <section id="properties" className="container-wide py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-royal">Properties</p>
            <h2 className="text-3xl font-black text-slate-900">Curated Portfolio</h2>
            <p className="text-slateInk">Browse our premium properties across Bangalore.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <Button
                key={filter.label}
                variant={active === filter.value ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActive(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayedProperties.map((property, idx) => (
            <PropertyCard key={property.id} property={property} idx={idx} />
          ))}
        </div>

        {/* Empty State */}
        {properties.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Properties Available</h3>
              <p className="text-slateInk mb-4">
                We're currently updating our property portfolio. New listings will be added soon!
              </p>
              <Button asChild variant="primary">
                <Link href="/contact">Get Notified</Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Filtered Empty State */}
        {properties.length > 0 && displayedProperties.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-slateInk mb-4">
              No properties found for the selected filter.
            </p>
            <Button
              variant="ghost"
              onClick={() => setActive(undefined)}
            >
              Clear Filter
            </Button>
          </motion.div>
        )}

        {/* View More Button */}
        {hasMore && properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex justify-center"
          >
            <Link href="/all-properties">
              <Button
                size="lg"
                className="bg-gradient-to-r from-royal to-purple hover:shadow-glow"
              >
                View All Properties
              </Button>
            </Link>
          </motion.div>
        )}
      </section>
    </>
  );
}