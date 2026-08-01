import type { CSSProperties } from "react";
import Link from "next/link";

const revealDelay = (ms: number) => ({ "--reveal-delay": `${ms}ms` } as CSSProperties);

export default function CtaSection() {
  return (
    <section className="bg-[#f8f6f2] px-5 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24 lg:py-28">
      <div
        className="reveal-up mx-auto max-w-[1200px]"
        style={revealDelay(90)}
      >
        <div className="relative overflow-hidden rounded-[24px] bg-[#2c3340] px-5 py-12 sm:px-8 sm:py-14 md:px-14 md:py-[68px]">
          <div className="pointer-events-none absolute -right-14 -top-14 hidden h-[210px] w-[210px] rounded-full bg-[rgba(184,154,94,0.06)] sm:block md:-right-[72px] md:-top-[80px] md:h-[300px] md:w-[300px]" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 hidden h-[160px] w-[160px] rounded-full bg-[rgba(255,255,255,0.04)] sm:block md:-bottom-[130px] md:-left-[70px] md:h-[230px] md:w-[230px]" />

          <div className="relative max-w-[440px]">
            <h2 className="font-display text-[clamp(2rem,3.6vw,36.7px)] font-bold leading-[1.12] tracking-[-0.02em] text-white">
              Ready to find your <span className="italic text-[#d4b87a]">dream home?</span>
            </h2>

            <p className="mt-4 max-w-[416px] text-[15px] leading-[1.6] text-[rgba(255,255,255,0.55)]">
              Schedule a free consultation with our property experts. No obligations, just honest
              guidance.
            </p>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
              <Link
                href="/contact#inquiry-form"
                className="inline-flex h-[51px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#b89a5e] px-8 text-[14px] font-semibold text-[#2c3340] transition-colors hover:bg-[#a88c52] sm:w-auto"
              >
                Get in Touch
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>

              <Link
                href="/properties"
                className="inline-flex h-[51px] w-full items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.2)] px-7 text-[14px] font-medium text-[rgba(255,255,255,0.8)] transition-colors hover:bg-[rgba(255,255,255,0.06)] sm:w-auto"
              >
                Browse Properties
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
