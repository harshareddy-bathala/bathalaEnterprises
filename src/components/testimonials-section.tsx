import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types/tables";

const revealDelay = (ms: number) => ({ "--reveal-delay": `${ms}ms` } as CSSProperties);

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function clampRating(value: number): number {
  return Math.max(1, Math.min(5, Math.round(value)));
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const visibleTestimonials = testimonials.slice(0, 3);
  const testimonialCount = visibleTestimonials.length;

  const topRowTestimonials = visibleTestimonials.slice(0, 2);
  const bottomCenteredTestimonial = testimonialCount === 3 ? visibleTestimonials[2] : null;

  const renderTestimonialCard = (item: Testimonial, index: number) => {
    const normalizedRating = clampRating(item.rating);

    return (
      <article
        key={item.id}
        className="reveal-up flex min-h-[300px] flex-col rounded-[16px] border border-[#f0ede7] bg-[#fdfcfa] px-5 pb-5 pt-5 sm:min-h-[315px] sm:px-6 sm:pb-6 sm:pt-6 md:min-h-[335px] md:px-8 md:pb-8 md:pt-8"
        style={revealDelay(140 + index * 85)}
      >
        <span className="material-symbols-outlined text-[24px] text-[#d4b87a]" aria-hidden="true">format_quote</span>

        <p className="mt-4 text-[14px] leading-[1.75] text-[#4a5568] sm:text-[14.5px]">"{item.content}"</p>

        <div className="mt-5 flex items-center gap-1 text-[#d4b87a]">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= normalizedRating;
            return (
              <span
                key={`${item.id}-${star}`}
                className={`material-symbols-outlined text-[14px] ${isFilled ? "text-[#d4b87a]" : "text-[#e5ddd0]"}`}
                style={{
                  fontVariationSettings: isFilled
                    ? "'FILL' 1, 'wght' 760, 'GRAD' 200, 'opsz' 20"
                    : "'FILL' 0, 'wght' 330, 'GRAD' 0, 'opsz' 20",
                }} aria-hidden="true">
                star
              </span>
            );
          })}
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-[#f0ede7] pt-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#b89a5e_0%,#d4b87a_100%)]">
            <span className="font-display text-[16px] font-bold text-white">{getInitial(item.name)}</span>
          </div>

          <div>
            <p className="text-[14px] font-semibold text-[#1a1f2e]">{item.name}</p>
            <p className="text-[12px] text-[#9ca3af]">{item.role || "Verified Client"}</p>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section id="testimonials" className="bg-white py-14 sm:py-16 md:py-20">
      <div className="bathala-container">
        <header className="reveal-up mx-auto max-w-[640px] text-center" style={revealDelay(70)}>
          <div className="flex items-center justify-center gap-2">
            <span className="h-[1.5px] w-8 bg-[#b89a5e]" />
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#b89a5e]">Testimonials</p>
            <span className="h-[1.5px] w-8 bg-[#b89a5e]" />
          </div>

          <h2 className="mt-4 font-display text-[clamp(2rem,8vw,48px)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#1a1f2e]">
            What Our <span className="italic text-[#4a5568]">Clients</span> Say
          </h2>

          <p className="mt-3 text-[15px] leading-[1.6] text-[#6b7280]">
            Trusted by hundreds of families across Electronic City.
          </p>
        </header>

        {visibleTestimonials.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#f0ede7] bg-[#fdfcfa] p-8 text-center md:mt-14">
            <p className="text-sm text-[#6b7280]">
              Testimonials will appear here once they are added in the admin panel.
            </p>
          </div>
        ) : (
          <div className="mt-10 md:mt-14">
            {testimonialCount < 3 ? (
              <div className={cn("grid gap-5 md:gap-6", testimonialCount === 1 ? "mx-auto max-w-[450px] grid-cols-1" : "grid-cols-1 md:grid-cols-2") }>
                {visibleTestimonials.map((item, index) => renderTestimonialCard(item, index))}
              </div>
            ) : (
              <div className="space-y-5 md:space-y-6">
                <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                  {topRowTestimonials.map((item, index) => renderTestimonialCard(item, index))}
                </div>

                {bottomCenteredTestimonial ? (
                  <div className="mx-auto max-w-[450px]">
                    {renderTestimonialCard(bottomCenteredTestimonial, 2)}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
