"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

/**
 * Group-level boundary for the public site. Without it, /about, /services,
 * /services/[slug], /privacy and /terms had no boundary at all and a thrown
 * error fell through to global-error.tsx, which replaces the whole document
 * including the navbar and footer.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "(site)", digest: error.digest });
  }, [error]);

  return (
    <div className="bathala-page flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <span className="material-symbols-outlined text-3xl text-red-600" aria-hidden="true">
          error
        </span>
      </div>
      <h1 className="mb-2 font-display text-3xl font-semibold text-[#1a1f2e]">
        Something Went Wrong
      </h1>
      <p className="mb-6 max-w-md text-[#6b7280]">
        We hit an unexpected problem loading this page. Please try again, or head back
        home and pick up from there.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={reset} className="gap-2">
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            refresh
          </span>
          Try Again
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/" className="gap-2">
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              home
            </span>
            Go Home
          </Link>
        </Button>
      </div>
      {error.digest && <p className="mt-6 text-xs text-[#9ca3af]">Error ID: {error.digest}</p>}
    </div>
  );
}
