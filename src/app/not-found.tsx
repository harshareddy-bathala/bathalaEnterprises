import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bathala-page flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f1e5]">
        <span className="material-symbols-outlined text-4xl text-primary">search_off</span>
      </div>
      <h1 className="mb-2 font-display text-5xl font-semibold text-[#1a1f2e]">404</h1>
      <h2 className="mb-4 font-display text-2xl font-semibold text-[#2c3340]">Page Not Found</h2>
      <p className="mb-8 max-w-md text-[#6b7280]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      <form action="/properties" className="mb-6 flex w-full max-w-md items-center gap-2">
        <input
          type="search"
          name="q"
          placeholder="Search properties by title or location"
          className="h-11 flex-1 rounded-md border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button type="submit" variant="outline" size="md">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/" className="gap-2">
            <span className="material-symbols-outlined text-base">home</span>
            Go Home
          </Link>
        </Button>
        <Button variant="secondary" asChild size="lg">
          <Link href="/properties" className="gap-2">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            View Properties
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-[var(--color-text-muted)]">
        <Link href="/services" className="rounded-full border border-[var(--color-border)] px-3 py-1.5 hover:text-[var(--color-slate-primary)]">Services</Link>
        <Link href="/about" className="rounded-full border border-[var(--color-border)] px-3 py-1.5 hover:text-[var(--color-slate-primary)]">About</Link>
        <Link href="/contact" className="rounded-full border border-[var(--color-border)] px-3 py-1.5 hover:text-[var(--color-slate-primary)]">Contact</Link>
      </div>
    </div>
  );
}
