"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

type PageTransitionProps = {
  children: ReactNode;
};

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotionPreference();

  return (
    <div key={pathname} className={reduceMotion ? undefined : "bathala-route-transition"}>
      {children}
    </div>
  );
}
