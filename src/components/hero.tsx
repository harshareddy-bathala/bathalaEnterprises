"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { BLUR_DATA_URL } from "@/lib/image-utils";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import CountUp from "@/components/ui/count-up";

const revealDelay = (ms: number) => ({ "--reveal-delay": `${ms}ms` } as CSSProperties);
const clampParallax = (value: number, max: number) => Math.max(0, Math.min(max, value));

/** Static part of the parallax transform; the offset is layered on via a CSS var. */
const parallaxStyle = (scale: number): CSSProperties => ({
  transform: `translate3d(0, var(--parallax-offset, 0px), 0) scale(${scale})`,
  transformOrigin: "center top",
  willChange: "transform",
});

export default function Hero() {
  const reduceMotion = useReducedMotionPreference();
  const heroImageRef = useRef<HTMLDivElement>(null);
  const insetImageRef = useRef<HTMLDivElement>(null);

  // The scroll offset is written straight to a CSS custom property on each
  // frame. Holding it in React state instead re-rendered the whole Hero client
  // component on every animation frame while scrolling; the rAF guard stopped
  // listener pile-up but not the renders.
  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") {
      return;
    }

    let frame = 0;

    const updatePosition = () => {
      const scrollY = window.scrollY || 0;
      heroImageRef.current?.style.setProperty(
        "--parallax-offset",
        `${clampParallax(scrollY * 0.12, 38)}px`
      );
      insetImageRef.current?.style.setProperty(
        "--parallax-offset",
        `${clampParallax(scrollY * 0.08, 22)}px`
      );
      frame = 0;
    };

    const handleScroll = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(updatePosition);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [reduceMotion]);

  const heroImageStyle = reduceMotion ? undefined : parallaxStyle(1.045);
  const insetImageStyle = reduceMotion ? undefined : parallaxStyle(1.03);

  return (
    <section className="overflow-hidden border-b border-[#ece7de] bg-[#f8f6f2]">
      <div className="mx-auto grid max-w-[1200px] gap-8 xs:gap-11 px-4 xs:px-5 pb-10 xs:pb-12 pt-6 xs:pt-8 sm:pb-14 sm:pt-10 md:px-10 md:pb-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-[76px] lg:pb-[54px] lg:pt-[34px]">
        <div className="reveal-up-priority max-w-[430px]" style={revealDelay(40)}>
          <div className="reveal-up-priority flex items-center gap-2" style={revealDelay(80)}>
            <span className="h-[1.5px] w-6 rounded-full bg-[#b89a5e]" />
            <span className="text-[10px] xs:text-[11px] font-medium uppercase tracking-[0.18em] text-[#b89a5e]">
              Electronic City, Bangalore
            </span>
          </div>

          <h1
            className="reveal-up-priority mt-4 xs:mt-5 font-display text-[clamp(1.85rem,9vw,45.8px)] leading-[1.1] tracking-[-0.02em] text-[#1a1f2e]"
            style={revealDelay(130)}
          >
            Find Your Place in <span className="italic text-[#2c3340]">Bangalore&apos;s</span> Finest Addresses
          </h1>

          <p className="reveal-up-priority mt-4 xs:mt-5 max-w-[410px] text-[14px] xs:text-[15px] leading-[1.65] text-[#6b7280]" style={revealDelay(180)}>
            Premium apartments and villas for rent, lease and sale in Electronic City - managed with
            care, delivered with trust.
          </p>

          <div className="reveal-up-priority mt-6 xs:mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap" style={revealDelay(220)}>
            <Link
              href="/properties"
              className="inline-flex h-[48px] min-h-[44px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#b89a5e] px-7 text-[14px] font-semibold text-[#2c3340] transition-colors hover:bg-[#a88c52] touch-manipulation sm:w-auto"
            >
              Explore Properties
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>

            <Link
              href="/services"
              className="inline-flex h-[48px] min-h-[44px] w-full items-center justify-center rounded-[8px] border border-[#2c3340] px-7 text-[14px] font-medium text-[#2c3340] transition-colors hover:bg-[#efebe4] touch-manipulation sm:w-auto"
            >
              Our Services
            </Link>
          </div>

          <div className="reveal-up-priority mt-7 xs:mt-9 border-t border-[#e8e4dc] pt-4 xs:pt-5 sm:mt-10" style={revealDelay(270)}>
            <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3 sm:gap-3">
              <div className="border-r border-[#b89a5e]/35 pr-4">
                <p className="font-display text-[20px] xs:text-[22px] font-bold leading-[22px] text-[#1a1f2e]"><CountUp value={50} suffix="+" /></p>
                <p className="mt-1 text-[11px] xs:text-[12px] leading-[18px] tracking-[0.03em] text-[#6b7280]">Properties</p>
              </div>
              <div className="pl-4 sm:border-r sm:border-[#b89a5e]/35 sm:px-4">
                <p className="font-display text-[20px] xs:text-[22px] font-bold leading-[22px] text-[#1a1f2e]"><CountUp value={200} suffix="+" /></p>
                <p className="mt-1 text-[11px] xs:text-[12px] leading-[18px] tracking-[0.03em] text-[#6b7280]">Happy Families</p>
              </div>
              <div className="col-span-2 border-t border-[#ece7de] pt-4 sm:col-span-1 sm:border-t-0 sm:pl-4 sm:pt-0">
                <p className="font-display text-[20px] xs:text-[22px] font-bold leading-[22px] text-[#1a1f2e]"><CountUp value={10} suffix="+" /></p>
                <p className="mt-1 text-[11px] xs:text-[12px] leading-[18px] tracking-[0.03em] text-[#6b7280]">Years of Trust</p>
              </div>
            </div>
          </div>
        </div>

        <div className="reveal-up-priority relative mx-auto w-full max-w-[430px] lg:mx-0" style={revealDelay(140)}>
          {/* --parallax-offset is set here and inherited by the image below. */}
          <div
            ref={heroImageRef}
            className="relative h-[320px] overflow-hidden rounded-[20px] border border-[#ddd5c8] bg-[#e8e4dc] shadow-[0_2px_8px_rgba(0,0,0,0.07),0_12px_40px_rgba(0,0,0,0.09)] xs:h-[370px] xs:rounded-[24px] sm:h-[430px] md:h-[520px] lg:h-[543px]"
          >
            <Image
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1080&q=80"
              alt="Luxury property exterior"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL.hero}
              className="object-cover"
              style={heroImageStyle}
            />

            <div className="absolute left-4 xs:left-5 top-4 xs:top-5 inline-flex h-[28px] xs:h-[30px] items-center gap-[6px] rounded-full bg-[rgba(255,255,255,0.95)] px-[8px] xs:px-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#b89a5e]" />
              <span className="text-[10px] xs:text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1f2e]">New Listing</span>
            </div>
          </div>

          <div
            className="reveal-up-priority absolute -bottom-7 left-0 hidden w-[200px] overflow-hidden rounded-[16px] border border-[#f0ede7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.06)] lg:-left-[22px] md:block"
            style={revealDelay(250)}
          >
            <div ref={insetImageRef} className="relative h-[186px] w-full overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1617104551722-3b2d51366400?auto=format&fit=crop&w=800&q=80"
                alt="Property interior"
                fill
                sizes="200px"
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL.property}
                className="object-cover"
                style={insetImageStyle}
              />
            </div>
          </div>

          <div
            className="absolute -top-4 right-2 xs:right-4 inline-flex h-[27px] xs:h-[29px] items-center gap-1 rounded-full border border-[#e8e4dc] bg-white px-[12px] xs:px-[15px] text-[9px] xs:text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4a5568] shadow-[0_2px_10px_rgba(0,0,0,0.07)]"
            style={revealDelay(310)}
          >
            <span className="material-symbols-outlined text-[13px] xs:text-[14px] text-[#b89a5e]" aria-hidden="true">verified</span>
            RERA Approved
          </div>
        </div>
      </div>
    </section>
  );
}