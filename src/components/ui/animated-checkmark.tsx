type AnimatedCheckmarkProps = {
  className?: string;
};

export default function AnimatedCheckmark({ className }: AnimatedCheckmarkProps) {
  return (
    <span className={`animate-check-pop inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ${className || ""}`}>
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M16 5.5L8.25 13.25L4.25 9.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
