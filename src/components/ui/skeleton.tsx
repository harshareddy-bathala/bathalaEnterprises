"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-[#ece7de] via-[#f5f2ed] to-[#ece7de] bg-[length:200%_100%]",
        "rounded-md",
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

/**
 * Property card skeleton for loading states
 */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#e8e4dc] bg-white">
      {/* Image placeholder */}
      <Skeleton className="h-[268px] sm:h-[304px] md:h-[334px] rounded-none rounded-t-[18px]" />
      
      {/* Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Location */}
        <Skeleton className="h-4 w-1/2" />
        
        {/* Divider area */}
        <div className="border-t border-[#f0ede7] pt-3.5">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        {/* Price and CTA */}
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Service card skeleton
 */
export function ServiceCardSkeleton() {
  return (
    <div className="rounded-[20px] border border-[#e8e4dc] bg-white p-6">
      {/* Icon */}
      <Skeleton className="h-12 w-12 rounded-xl" />
      
      {/* Title */}
      <Skeleton className="mt-5 h-6 w-2/3" />
      
      {/* Description lines */}
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      
      {/* Link */}
      <Skeleton className="mt-5 h-4 w-24" />
    </div>
  );
}

/**
 * Testimonial card skeleton
 */
export function TestimonialCardSkeleton() {
  return (
    <div className="rounded-[20px] border border-[#e8e4dc] bg-white p-6">
      {/* Quote icon */}
      <Skeleton className="h-8 w-8 rounded" />
      
      {/* Quote text */}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Author */}
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Form field skeleton
 */
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

/**
 * Page header skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-3/4 max-w-md" />
      <Skeleton className="h-5 w-full max-w-lg" />
    </div>
  );
}

/**
 * Grid skeleton for multiple cards
 */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ServiceGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Content visibility wrapper for lazy loading
 */
export function LazySection({ 
  children, 
  className,
  fallback 
}: { 
  children: React.ReactNode; 
  className?: string;
  fallback?: React.ReactNode;
}) {
  return (
    <div 
      className={cn("content-auto", className)}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
    >
      {children}
    </div>
  );
}
