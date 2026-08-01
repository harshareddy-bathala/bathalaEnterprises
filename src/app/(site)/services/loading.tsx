import { PageHeaderSkeleton, ServiceGridSkeleton } from "@/components/ui/skeleton";

/** See properties/loading.tsx — skeleton over spinner to preserve layout. */
export default function Loading() {
  return (
    <div className="bathala-page pb-20 pt-14 sm:pt-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading services</span>
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <PageHeaderSkeleton />
        <div className="mt-10">
          <ServiceGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
