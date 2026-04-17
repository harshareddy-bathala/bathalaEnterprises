import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva("font-semibold tracking-[0.12em]", {
  variants: {
    variant: {
      default: "text-[11px] uppercase text-[var(--color-slate-secondary)]",
      floating:
        "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-1 text-xs uppercase text-[var(--color-text-muted)] transition-all peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-primary peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-xs",
      inline: "text-xs normal-case tracking-normal text-[var(--color-text-muted)]"
    },
    state: {
      default: "",
      error: "text-red-600",
      success: "text-emerald-600"
    }
  },
  defaultVariants: {
    variant: "default",
    state: "default"
  }
});

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & VariantProps<typeof labelVariants>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, variant, state, ...props }, ref) => (
  <label ref={ref} className={cn(labelVariants({ variant, state }), className)} {...props} />
));
Label.displayName = "Label";

export { Label };