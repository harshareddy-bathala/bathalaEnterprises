type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export default function LoadingSpinner({ size = "md", label = "Loading", className }: LoadingSpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className || ""}`} role="status" aria-live="polite">
      <span className={`relative inline-flex items-center justify-center rounded-full border-2 border-[#e8e4dc] ${sizeClasses[size]}`}>
        <span className="bathala-spinner-ring absolute inset-0 rounded-full border-2 border-transparent border-t-[#b89a5e] border-r-[#b89a5e]" />
        <span className="font-display text-[10px] font-bold text-[#b89a5e]">B</span>
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
