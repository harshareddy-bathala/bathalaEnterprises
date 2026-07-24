"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BLUR_DATA_URL } from "@/lib/image-utils";

type PropertyGalleryLightboxProps = {
  title: string;
  images: string[];
};

export default function PropertyGalleryLightbox({
  title,
  images,
}: PropertyGalleryLightboxProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!lightboxOpen || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [lightboxOpen]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setLightboxIndex((previous) => (previous + 1) % images.length);
  };

  const prevImage = () => {
    setLightboxIndex((previous) => (previous - 1 + images.length) % images.length);
  };

  return (
    <>
      <section className="space-y-4">
        <h2 className="font-display text-[28px] xs:text-[34px] font-semibold leading-[1.1] text-[#1a1f2e]">Photo Gallery</h2>
        <div className="grid grid-cols-2 gap-3 xs:gap-4 md:grid-cols-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className="group relative aspect-[4/3] overflow-hidden rounded-lg xs:rounded-xl border border-[#e8e4dc] touch-manipulation"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={image}
                alt={`${title} - Image ${index + 1}`}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 320px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL.property}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>

      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-50 min-h-[44px] min-w-[44px] rounded-full p-2 text-white transition hover:bg-white/10 touch-manipulation"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 xs:left-4 z-50 min-h-[44px] min-w-[44px] rounded-full bg-black/30 p-2 text-white transition hover:bg-black/50 touch-manipulation"
                aria-label="Previous"
              >
                <span className="material-symbols-outlined text-2xl xs:text-3xl">chevron_left</span>
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 xs:right-4 z-50 min-h-[44px] min-w-[44px] rounded-full bg-black/30 p-2 text-white transition hover:bg-black/50 touch-manipulation"
                aria-label="Next"
              >
                <span className="material-symbols-outlined text-2xl xs:text-3xl">chevron_right</span>
              </button>
            </>
          )}

          <div className="mx-2 xs:mx-4 w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <div className="relative h-[min(68dvh,540px)] w-full xs:h-[min(78dvh,620px)]">
              <Image
                src={images[lightboxIndex]}
                alt={`${title} - Image ${lightboxIndex + 1}`}
                fill
                priority
                sizes="100vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL.property}
                className="rounded-lg object-contain"
              />
            </div>
            <p className="mt-4 text-center text-sm text-white">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
