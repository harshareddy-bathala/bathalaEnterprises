import type { CSSProperties } from "react";

const revealDelay = (ms: number) => ({ "--reveal-delay": `${ms}ms` } as CSSProperties);

const trustItems = [
  { icon: "verified_user", label: "Fully Verified Operations" },
  { icon: "star", label: "Electronic City's #1 Property Manager" },
  { icon: "schedule", label: "Since 2014" },
];

export default function TrustBar() {
  const marqueeItems = [...trustItems, ...trustItems];

  return (
    <section className="border-y border-[#3a4250] bg-[#2c3340]">
      <div className="mx-auto max-w-[1200px] px-4 py-2.5 md:px-10 md:py-3">
        <div className="overflow-hidden md:hidden" style={revealDelay(50)}>
          <div className="trust-marquee-track flex w-max items-center gap-4 whitespace-nowrap py-0.5">
            {marqueeItems.map((item, index) => {
              const duplicated = index >= trustItems.length;
              const separatorVisible = index < marqueeItems.length - 1;

              return (
                <div
                  key={`${item.label}-${index}`}
                  aria-hidden={duplicated}
                  className="inline-flex min-w-max items-center gap-2 text-center text-[11px] font-medium tracking-[0.06em] text-[rgba(255,255,255,0.62)]"
                >
                  <span className="material-symbols-outlined text-[14px] text-[#b89a5e]">{item.icon}</span>
                  <span>{item.label}</span>

                  {separatorVisible ? (
                    <span className="ml-2 h-3.5 w-px bg-[#b89a5e]/35" aria-hidden="true" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center justify-center gap-8 md:flex" style={revealDelay(50)}>
          {trustItems.map((item, index) => (
            <div
              key={item.label}
              className="reveal-up inline-flex min-w-max items-center gap-2 text-center text-[11px] font-medium tracking-[0.06em] text-[rgba(255,255,255,0.62)]"
              style={revealDelay(90 + index * 70)}
            >
              <span className="material-symbols-outlined text-[14px] text-[#b89a5e]">{item.icon}</span>
              <span>{item.label}</span>

              {index < trustItems.length - 1 ? (
                <span className="ml-5 h-3.5 w-px bg-[#b89a5e]/35" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
