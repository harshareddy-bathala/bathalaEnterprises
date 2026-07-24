import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon = "inbox",
  actionLabel,
  actionHref,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={`rounded-xl border border-dashed border-[var(--color-border)] bg-[#fcfaf6] px-6 py-10 text-center ${className || ""}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2eadb] text-[#b89a5e]">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
      {!action && actionLabel && actionHref ? (
        <div className="mt-5">
          <Button asChild variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
