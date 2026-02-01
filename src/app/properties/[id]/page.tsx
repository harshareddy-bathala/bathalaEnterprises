"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bed, Maximize2, MapPin, Phone, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Only gallery images for lightbox (exclude thumbnail)
  const galleryImages = property?.gallery_images?.filter(Boolean) as string[] || [];

  useEffect(() => {
    const loadProperty = async () => {
      const data = await getPropertyById(params.id);
      setProperty(data);
      setLoading(false);
    };
    loadProperty();
  }, [params.id]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Generate contact URL with pre-filled property info
  const getContactUrl = () => {
    const params = new URLSearchParams({
      property_id: property?.id || '',
      property_title: property?.title || '',
      property_type: property?.type || '',
    });
    return `/contact?${params.toString()}`;
  };

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

      {/* Hero Section - Thumbnail (no click/hover effects) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container-wide"
      >
        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple/20">
          <img
            src={property.thumbnail_url || property.image_url}
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
              {property.type === "Rent" && <span className="text-xl">/month</span>}
              {property.type === "Lease" && <span className="text-xl">/year</span>}
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
            {property.description ? (
              <p className="text-slateInk leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            ) : (
              <p className="text-slateInk leading-relaxed">
                This premium {property.type.toLowerCase()} property is located in {property.location}. 
                Featuring {property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''} and {formatNumber(property.sqft)} square feet of living space.
                Contact us for more details about this property.
              </p>
            )}
          </div>

          {/* Image Gallery */}
          {galleryImages.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900">Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryImages.map((img, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(idx)}
                  >
                    <img
                      src={img}
                      alt={`${property.title} - Image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
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
                <Link href={getContactUrl()}>Request More Info</Link>
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
                  <Link href={getContactUrl()}>
                    <Phone className="h-4 w-4" />
                    Contact Us
                  </Link>
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

      {/* Lightbox Modal - Gallery images only */}
      {lightboxOpen && galleryImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-50"
            aria-label="Close lightbox"
          >
            <X className="h-8 w-8" />
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 text-white hover:text-gray-300 transition z-50 p-2 rounded-full bg-black/30 hover:bg-black/50"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 text-white hover:text-gray-300 transition z-50 p-2 rounded-full bg-black/30 hover:bg-black/50"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div className="max-w-5xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={galleryImages[lightboxIndex]}
              alt={`${property.title} - Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-white text-center mt-4 text-sm">
              {lightboxIndex + 1} / {galleryImages.length}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
