import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldSize?: "md" | "lg";
  state?: "default" | "error" | "success";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, fieldSize = "md", state = "default", ...props }, ref) => {
  const isError = state === "error" || props["aria-invalid"] === true;
  const isSuccess = state === "success";

  return (
    <textarea
      className={cn(
        "peer flex w-full resize-none rounded-md border bg-white px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-[#f4f1ea] disabled:text-[var(--color-text-muted)] disabled:opacity-80",
        fieldSize === "md" ? "min-h-[120px] py-3" : "min-h-[160px] py-4 text-base",
        isError
          ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200"
          : isSuccess
            ? "border-emerald-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-200"
            : "border-[var(--color-border)] focus-visible:border-primary focus-visible:ring-primary/35",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };