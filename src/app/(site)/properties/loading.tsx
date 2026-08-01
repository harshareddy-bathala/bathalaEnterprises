import { PageHeaderSkeleton, PropertyGridSkeleton } from "@/components/ui/skeleton";

/**
 * Skeleton rather than a centred spinner, so the page keeps its shape while
 * loading instead of flashing blank. The skeleton components already existed
 * in src/components/ui/skeleton.tsx but were unused.
 */
export default function Loading() {
  return (
    <div className="bathala-page pb-20 pt-14 sm:pt-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading properties</span>
      <div className="bathala-container">
        <PageHeaderSkeleton />
        <div className="mt-10">
          <PropertyGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
