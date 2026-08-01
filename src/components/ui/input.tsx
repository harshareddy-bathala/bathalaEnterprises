import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldSize?: "md" | "lg";
  state?: "default" | "error" | "success";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", fieldSize = "md", state = "default", ...props }, ref) => {
  const isError = state === "error" || props["aria-invalid"] === true;
  const isSuccess = state === "success";

  return (
    <input
      type={type}
      className={cn(
        "peer flex w-full rounded-md border bg-white px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-[#f4f1ea] disabled:text-[var(--color-text-muted)] disabled:opacity-80",
        fieldSize === "md" ? "h-11 py-2" : "h-[52px] py-3 text-base",
        isError
          ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200"
          : isSuccess
            ? "border-emerald-400 pr-10 focus-visible:border-emerald-500 focus-visible:ring-emerald-200"
            : "border-[var(--color-border)] focus-visible:border-primary focus-visible:ring-primary/35",
        isSuccess && "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 20 20%22 fill=%22none%22%3E%3Cpath d=%27M16.5 5.5L8.25 13.75L3.5 9%27 stroke=%27%2316A34A%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };