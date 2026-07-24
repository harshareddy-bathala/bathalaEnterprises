"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PropertyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bathala-page flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <span className="material-symbols-outlined text-3xl text-red-600" aria-hidden="true">error</span>
      </div>
      <h1 className="mb-2 font-display text-3xl font-semibold text-[#1a1f2e]">
        Property Unavailable
      </h1>
      <p className="mb-6 max-w-md text-[#6b7280]">
        We couldn&apos;t load this property listing. It may have been removed or there&apos;s a temporary issue.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={reset} className="gap-2">
          <span className="material-symbols-outlined text-base" aria-hidden="true">refresh</span>
          Try Again
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/all-properties" className="gap-2">
            <span className="material-symbols-outlined text-base" aria-hidden="true">apartment</span>
            View All Properties
          </Link>
        </Button>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-[#9ca3af]">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
