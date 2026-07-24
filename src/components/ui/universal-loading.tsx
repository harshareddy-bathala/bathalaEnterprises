type UniversalLoadingProps = {
  message?: string;
  detail?: string;
  className?: string;
};

export default function UniversalLoading({
  message = "Loading...",
  detail,
  className,
}: UniversalLoadingProps) {
  return (
    <section
      className={`bathala-page flex min-h-[60vh] items-center justify-center ${className || ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative h-10 w-10" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border border-[#ece7de] bg-white/80" />
          <div className="absolute inset-[3px] bathala-spinner-ring rounded-full border-2 border-[#e5e2db] border-t-[#b89a5e]" />
        </div>
        <p className="text-sm font-medium text-[#6b7280]">{message}</p>
        <div className="flex items-center gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c6b08a]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b89a5e] [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9e8353] [animation-delay:240ms]" />
        </div>
        {detail ? <p className="max-w-sm text-xs text-[#9ca3af]">{detail}</p> : null}
      </div>
    </section>
  );
}