"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bed, Maximize2, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { getPropertyById } from "@/lib/supabase-queries";
import type { Property } from "@/lib/supabase-queries";

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperty = async () => {
      const data = await getPropertyById(params.id);
      setProperty(data);
      setLoading(false);
    };
    loadProperty();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container-wide py-20 text-center">
        <h1 className="text-3xl font-black text-slate-900 mb-4">Property not found</h1>
        <Button asChild>
          <Link href="/properties">Back to Properties</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Navigation */}
      <div className="container-wide pt-4">
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 text-royal hover:text-amberGlow transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container-wide"
      >
        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple/20">
          <img
            src={property.image_url}
            alt={property.title}
            className="w-full h-96 object-cover"
          />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="container-wide grid gap-8 lg:grid-cols-3"
      >
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="inline-block mb-4 px-3 py-1 rounded-full bg-gradient-to-r from-royal/10 to-purple/10 text-royal font-semibold text-sm">
              {property.type.toUpperCase()}
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">{property.title}</h1>
            <div className="flex items-center gap-2 text-slateInk text-lg">
              <MapPin className="h-5 w-5 text-royal" />
              {property.location}
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl bg-gradient-to-br from-royal/5 to-purple/5 p-6 border border-white/50">
            <p className="text-sm text-slateInk mb-2">Price</p>
            <p className="text-4xl font-black text-slate-900">
              ₹{formatNumber(property.price)}
              {property.type !== "Sale" && <span className="text-xl">/month</span>}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border border-white/60">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-2">
                  <Bed className="h-8 w-8 text-royal" />
                </div>
                <p className="text-2xl font-black text-slate-900">{property.bedrooms}</p>
                <p className="text-sm text-slateInk">Bedrooms</p>
              </CardContent>
            </Card>
            <Card className="border border-white/60">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-2">
                  <Maximize2 className="h-8 w-8 text-royal" />
                </div>
                <p className="text-2xl font-black text-slate-900">{formatNumber(property.sqft)}</p>
                <p className="text-sm text-slateInk">Sq. Ft.</p>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">About This Property</h2>
            <p className="text-slateInk leading-relaxed">
              This premium {property.type} property is located in {property.location}, one of Bangalore's most desirable neighborhoods. 
              Featuring {property.bedrooms} spacious bedrooms and {formatNumber(property.sqft)} square feet of modern living space, 
              this property is perfect for discerning buyers and renters looking for quality and convenience.
            </p>
            <p className="text-slateInk leading-relaxed">
              The property includes modern amenities, excellent connectivity, and is in close proximity to shopping malls, 
              restaurants, and business districts. An ideal investment for long-term returns or immediate occupancy.
            </p>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Amenities</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                "Modern Kitchen",
                "Air Conditioning",
                "Parking",
                "24/7 Security",
                "Gym Facility",
                "Swimming Pool",
                "Power Backup",
                "Water Supply"
              ].map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 p-3 rounded-lg bg-white/60 border border-white/50">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-royal to-purple" />
                  <span className="text-slateInk font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="sticky top-24 border border-white/60">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">Interested?</h3>
                <p className="text-sm text-slateInk mb-4">
                  Contact us for more details, site visits, or to discuss financing options.
                </p>
              </div>

              <Button asChild size="lg" className="w-full" variant="primary">
                <Link href="/contact">Request More Info</Link>
              </Button>

              <div className="space-y-3 pt-4 border-t border-white/50">
                <div>
                  <p className="text-xs text-slateInk uppercase tracking-wide mb-1">Property ID</p>
                  <p className="font-mono text-sm text-slate-900">{property.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slateInk uppercase tracking-wide mb-1">Type</p>
                  <p className="font-semibold text-slate-900 capitalize">{property.type}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/50">
                <p className="text-xs text-slateInk uppercase tracking-wide mb-3">Contact Agent</p>
                <Button
                  asChild
                  variant="secondary"
                  className="w-full gap-2"
                >
                  <a href="tel:+919876543210">
                    <Phone className="h-4 w-4" />
                    Call Agent
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Location Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="container-wide"
      >
        <h2 className="text-2xl font-black text-slate-900 mb-4">Location</h2>
        <div className="rounded-2xl overflow-hidden shadow-lg h-96">
          <iframe
            src={`https://maps.google.com/maps?q=${property.location.split(",")[0]},bangalore&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </motion.div>
    </div>
  );
}
