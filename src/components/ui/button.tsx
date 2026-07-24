"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-ripple inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98] touch-manipulation",
  {
    variants: {
      variant: {
        primary: "bg-primary text-[var(--color-slate-primary)] shadow-brand-gold hover:bg-primary-hover focus-visible:ring-primary",
        secondary: "bg-[var(--color-slate-primary)] text-[var(--color-surface)] hover:bg-[var(--color-slate-secondary)] focus-visible:ring-[var(--color-slate-secondary)]",
        outline: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-primary hover:text-[var(--color-slate-primary)] hover:bg-[#faf7f1] focus-visible:ring-primary",
        ghost: "bg-transparent text-[var(--color-slate-primary)] hover:bg-[#ede9df] hover:text-[var(--color-text-primary)] focus-visible:ring-primary",
        icon: "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-slate-primary)] hover:bg-[#f3eee5] hover:border-primary focus-visible:ring-primary"
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-5",
        lg: "h-[52px] px-7 text-base",
        icon: "h-11 w-11 p-0 min-w-[44px]"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
  if (asChild) {
    return (
      <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} aria-busy={loading || undefined} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Spinner /> : null}
      {loading ? (loadingText || children) : children}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };