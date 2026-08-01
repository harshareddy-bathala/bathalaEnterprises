"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

/**
 * Boundary for the whole admin surface.
 *
 * All six admin pages fetch Supabase client-side. Before this existed, an
 * unhandled throw fell through to global-error.tsx, which replaces the entire
 * document and destroys the admin shell — leaving no navigation back.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "admin", digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <span className="material-symbols-outlined text-3xl text-red-600" aria-hidden="true">
          error
        </span>
      </div>
      <h1 className="mb-2 font-display text-3xl font-semibold text-[var(--color-text-primary)]">
        Dashboard Error
      </h1>
      <p className="mb-6 max-w-md text-[var(--color-text-muted)]">
        Something went wrong loading this section. Your data has not been changed.
        Try again, and if it keeps happening check that your Supabase connection and
        admin permissions are configured.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={reset} className="gap-2">
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            refresh
          </span>
          Try Again
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/admin/dashboard" className="gap-2">
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              dashboard
            </span>
            Back to Dashboard
          </Link>
        </Button>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-[var(--color-text-muted)]">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
