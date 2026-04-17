import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-xl border", {
  variants: {
    variant: {
      default: "border-[var(--color-border)] bg-[var(--color-surface)] shadow-brand-soft",
      elevated: "border-[var(--color-border)] bg-[var(--color-surface)] shadow-brand-medium",
      outlined: "border-[var(--color-border)] bg-transparent shadow-none",
      glass: "border-[color-mix(in_oklab,var(--color-border)_65%,transparent)] bg-[color-mix(in_oklab,var(--color-surface)_92%,transparent)] backdrop-blur"
    },
    interactive: {
      true: "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-brand-strong",
      false: ""
    }
  },
  defaultVariants: {
    variant: "default",
    interactive: false
  }
});

type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, interactive, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant, interactive }), className)} {...props} />
));
Card.displayName = "Card";

const cardSectionPadding = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6"
};

type CardSectionProps = React.HTMLAttributes<HTMLDivElement> & { padding?: keyof typeof cardSectionPadding };

const CardHeader = ({ className, padding = "md", ...props }: CardSectionProps) => (
  <div className={cn(cardSectionPadding[padding], "pb-2", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-lg font-bold text-[#1a1f2e]", className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-[#6b7280]", className)} {...props} />
);

const CardContent = ({ className, padding = "md", ...props }: CardSectionProps) => (
  <div className={cn(cardSectionPadding[padding], "pt-0", className)} {...props} />
);

const CardFooter = ({ className, padding = "md", ...props }: CardSectionProps) => (
  <div className={cn(cardSectionPadding[padding], "pt-0", className)} {...props} />
);

const CardSkeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-brand-soft",
      className
    )}
    {...props}
  >
    <div className="h-4 w-1/3 animate-pulse rounded bg-[#eee8dc]" />
    <div className="mt-4 h-3 w-full animate-pulse rounded bg-[#f1ece2]" />
    <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-[#f1ece2]" />
    <div className="mt-6 h-9 w-24 animate-pulse rounded bg-[#eee8dc]" />
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardSkeleton };