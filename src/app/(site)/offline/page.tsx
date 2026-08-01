import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Offline",
  description: "Offline fallback page for Bathala Enterprises.",
  path: "/offline",
  index: false,
});

export default function OfflinePage() {
  return (
    <div className="bathala-page flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f1e5] text-[#b89a5e]">
        <span className="material-symbols-outlined text-4xl" aria-hidden="true">wifi_off</span>
      </div>

      <h1 className="font-display text-3xl font-semibold text-[#1a1f2e]">You are Offline</h1>
      <p className="mt-3 max-w-md text-sm leading-[1.6] text-[#6b7280]">
        Reconnect to continue browsing the latest listings and services. Cached pages may still be available.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <form action="/offline">
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center rounded-md bg-[#b89a5e] px-4 text-sm font-semibold text-[#2c3340]"
          >
            Try Again
          </button>
        </form>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-md border border-[#e8e4dc] bg-white px-4 text-sm font-semibold text-[#2c3340]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
