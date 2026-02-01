"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import type { Property as SupabaseProperty } from "@/lib/supabase-queries";
import { getPropertiesFromSupabase } from "@/lib/supabase-queries";

type PropertyType = "Rent" | "Lease" | "Sale" | undefined;
type Property = SupabaseProperty;

const typeFilters: { label: string; value?: PropertyType }[] = [
  { label: "All", value: undefined },
  { label: "Rent", value: "Rent" as const },
  { label: "Lease", value: "Lease" as const },
  { label: "Sale", value: "Sale" as const }
];

export default function AllPropertiesPage() {
  const [active, setActive] = useState<PropertyType>(undefined);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      const data = await getPropertiesFromSupabase();
      setProperties(data as Property[]);
      setLoading(false);
    };
    loadProperties();
  }, []);

  const filtered = useMemo(
    () => properties.filter((p) => (active ? p.type === active : true)),
    [properties, active]
  );

  const PropertyCard = ({ property, idx }: { property: Property; idx: number }) => (
    <motion.div
      key={property.id}
      layout
      whileHover={{ y: -6 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
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
              <Badge className="bg-white/90 text-slate-900 font-semibold">
                {property.type.toUpperCase()}
              </Badge>
            </div>
          </div>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-xl text-slate-900 group-hover:text-royal transition-colors">
              {property.title}
            </CardTitle>
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
    <div className="space-y-8 pt-32 pb-16">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-2"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-royal">
            Properties
          </p>
          <h1 className="text-4xl font-black text-slate-900">All Properties</h1>
          <p className="text-lg text-slateInk">
            Explore our complete portfolio of {filtered.length} premium properties.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal"></div>
          </div>
        ) : (
          <>
            {/* Filter Buttons */}
            <div className="mb-8 flex flex-wrap gap-2">
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

            {/* Properties Grid */}
            <motion.div
              layout
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((property, idx) => (
                <PropertyCard key={property.id} property={property} idx={idx} />
              ))}
            </motion.div>

            {/* Empty State */}
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-lg text-slateInk">No properties found for this filter.</p>
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
          <Link href="/#properties">
            <Button variant="ghost" size="lg">
              ← Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
