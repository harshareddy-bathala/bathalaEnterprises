"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring (in production, send to error tracking service)
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Error | Bathala Enterprises</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bathala-shell">
        <main role="main" className="container-wide flex min-h-screen items-center justify-center py-12">
          <section
            className="w-full max-w-[620px] rounded-[24px] border border-[#f2dddd] bg-white p-7 text-center shadow-[0_10px_40px_rgba(26,31,46,0.08),0_1px_4px_rgba(26,31,46,0.06)] sm:p-10"
            role="alert"
            aria-live="assertive"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f1] text-[30px] font-semibold text-red-600">
              !
            </div>

            <h1 className="font-display text-[34px] font-semibold leading-[1.15] text-[#1a1f2e]">
              Something went wrong
            </h1>

            <p className="mx-auto mt-3 max-w-[500px] text-[14px] leading-[1.65] text-[#6b7280]">
              An unexpected error occurred while loading this page. Please try again, or return home and continue browsing.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={reset}
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-[#b89a5e] px-6 text-[14px] font-semibold text-[#2c3340] transition-colors hover:bg-[#a98b52]"
                aria-label="Retry loading the page"
              >
                Try Again
              </button>

              <a
                href="/"
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] border border-[#e8e4dc] px-6 text-[14px] font-semibold text-[#2c3340] transition-colors hover:bg-[#f7f3eb]"
              >
                Go Home
              </a>
            </div>

            {error.digest && (
              <p className="mt-5 text-[12px] text-[#9ca3af]">Error ID: {error.digest}</p>
            )}
          </section>
        </main>
      </body>
    </html>
  );
}
