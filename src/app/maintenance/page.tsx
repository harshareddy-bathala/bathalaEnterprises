import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Maintenance",
  description: "Bathala Enterprises is temporarily under maintenance.",
  alternates: {
    canonical: "/maintenance",
  },
};

export default function MaintenancePage() {
  return (
    <div className="bathala-page flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f1e5] text-[#b89a5e]">
        <span className="material-symbols-outlined text-4xl">construction</span>
      </div>
      <h1 className="font-display text-4xl font-semibold text-[var(--color-text-primary)]">Scheduled Maintenance</h1>
      <p className="mt-3 max-w-lg text-sm text-[var(--color-text-muted)]">
        We are polishing your experience right now. The site will be back shortly with improved performance and consistency.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="primary" size="md">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild variant="outline" size="md">
          <Link href="/contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
