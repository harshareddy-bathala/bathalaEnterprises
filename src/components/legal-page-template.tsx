type LegalSection = {
  id: string;
  title: string;
  intro?: string;
  paragraphs?: string[];
  bullets?: string[];
  outro?: string;
};

type LegalPageTemplateProps = {
  title: string;
  accent: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
  contactTitle: string;
  contactIntro: string;
  contactEmail: string;
  phone: string;
  address: string;
};

export default function LegalPageTemplate({
  title,
  accent,
  intro,
  lastUpdated,
  sections,
  contactTitle,
  contactIntro,
  contactEmail,
  phone,
  address,
}: LegalPageTemplateProps) {
  const dialPhone = phone.replace(/\s+/g, "");
  const contactCardContent = (
    <>
      <p className="font-display text-[21px] font-semibold leading-[1.2] text-[var(--color-text-primary)] sm:text-[22px]">
        {contactTitle}
      </p>
      <p className="mt-2 text-[13.5px] leading-[1.7] text-[var(--color-text-muted)]">{contactIntro}</p>

      <div className="mt-5 space-y-3 text-[13.5px] leading-[1.6]">
        <a
          href={`mailto:${contactEmail}`}
          className="block max-w-full break-all border-b border-[rgba(184,154,94,0.35)] font-medium text-[var(--color-slate-primary)] transition-colors hover:text-[var(--color-gold-deep)] sm:w-fit sm:break-normal"
        >
          {contactEmail}
        </a>
        <a
          href={`tel:${dialPhone}`}
          className="block max-w-full break-all border-b border-[rgba(184,154,94,0.35)] font-medium text-[var(--color-slate-primary)] transition-colors hover:text-[var(--color-gold-deep)] sm:w-fit sm:break-normal"
        >
          {phone}
        </a>
        <p className="break-words text-[var(--color-text-muted)]">{address}</p>
      </div>
    </>
  );

  return (
    <div className="bathala-page overflow-x-hidden pb-16 pt-10 sm:pb-20 sm:pt-14">
      <section className="bathala-container">
        <header className="relative overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(155deg,rgba(255,255,255,0.98)_0%,rgba(248,246,242,0.98)_46%,rgba(244,241,235,0.94)_100%)] px-5 py-7 sm:rounded-[22px] sm:px-8 sm:py-10 lg:px-10 lg:py-11">
          <div className="pointer-events-none absolute -right-16 -top-20 h-[180px] w-[180px] rounded-full bg-[rgba(184,154,94,0.12)] blur-3xl" />
          <div className="pointer-events-none absolute -left-14 bottom-0 h-[120px] w-[120px] rounded-full bg-[rgba(44,51,64,0.08)] blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="h-[1.5px] w-8 rounded-[2px] bg-[var(--color-gold-accent)]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-gold-accent)]">Legal</p>
            </div>

            <h1 className="mt-4 max-w-[680px] font-display text-[clamp(1.95rem,8vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.02em] text-[var(--color-text-primary)]">
              {title} <span className="italic text-[var(--color-slate-secondary)]">{accent}</span>
            </h1>

            <p className="mt-4 max-w-[65ch] text-[14.5px] leading-[1.75] text-[var(--color-slate-secondary)] sm:mt-5 sm:text-[16px]">
              {intro}
            </p>

            <p className="mt-5 inline-flex items-center rounded-full border border-[rgba(184,154,94,0.25)] bg-[rgba(184,154,94,0.08)] px-3 py-1.5 text-[11.5px] font-medium text-[var(--color-slate-primary)] sm:mt-6 sm:text-[12px]">
              Last updated: {lastUpdated}
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
          <aside className="space-y-4 lg:sticky lg:top-[102px] lg:self-start">
            <div className="hidden bathala-panel p-4 sm:p-6 lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-accent)]">On this page</p>
              <nav aria-label="Policy sections">
                <ol className="-mx-1 mt-3.5 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar lg:mx-0 lg:mt-4 lg:block lg:space-y-1.5 lg:overflow-visible lg:px-0 lg:pb-0">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="group inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(184,154,94,0.28)] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[var(--color-slate-primary)] transition-colors hover:bg-[rgba(184,154,94,0.12)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-accent)] lg:flex lg:justify-between lg:rounded-[10px] lg:border-transparent lg:bg-transparent lg:px-3 lg:text-[13px]"
                      >
                        <span className="leading-[1.4]">{section.title}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] lg:text-[11px]">{index + 1}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <div className="hidden bathala-panel p-5 sm:p-6 lg:block">
              {contactCardContent}
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="bathala-panel-strong scroll-mt-[92px] space-y-4 p-4 sm:scroll-mt-[108px] sm:space-y-5 sm:p-7"
              >
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <span className="mt-[3px] inline-flex min-h-7 min-w-7 items-center justify-center rounded-full border border-[rgba(184,154,94,0.35)] bg-[rgba(184,154,94,0.08)] px-2 text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-gold-deep)] sm:min-h-8 sm:min-w-8 sm:text-[11px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="min-w-0 break-words font-display text-[clamp(1.28rem,5.5vw,1.95rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-[var(--color-text-primary)]">
                    {section.title}
                  </h2>
                </div>

                {section.intro ? (
                  <p className="max-w-[65ch] text-[14.5px] leading-[1.75] text-[var(--color-slate-secondary)] sm:text-[15.5px]">
                    {section.intro}
                  </p>
                ) : null}

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="max-w-[65ch] text-[14.5px] leading-[1.75] text-[var(--color-slate-secondary)] sm:text-[15.5px]"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets ? (
                  <ul className="space-y-2.5 sm:space-y-3">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[14.5px] leading-[1.75] text-[var(--color-slate-secondary)] sm:text-[15.5px]">
                        <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold-accent)]" />
                        <span className="max-w-[62ch]">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.outro ? (
                  <p className="max-w-[65ch] text-[14.5px] leading-[1.75] text-[var(--color-slate-secondary)] sm:text-[15.5px]">
                    {section.outro}
                  </p>
                ) : null}
              </section>
            ))}

            <div className="bathala-panel p-5 sm:p-6 lg:hidden">
              {contactCardContent}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export type { LegalSection };
