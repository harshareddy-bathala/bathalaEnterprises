import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] leading-[1.3] text-[var(--color-text-muted)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="inline-flex items-center rounded-sm transition-colors hover:text-[var(--color-slate-primary)]">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "inline-flex items-center font-semibold text-[var(--color-slate-primary)]" : "inline-flex items-center"}>{item.label}</span>
              )}
              {!isLast ? <span className="material-symbols-outlined text-[15px] leading-none text-[#b9ad95]" aria-hidden="true">chevron_right</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
