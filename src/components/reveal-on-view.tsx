"use client";

import { useMemo, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { SERVICE_MOTION_TOKENS } from "@/lib/theme-constants";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

type RevealOnViewProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  threshold?: number;
  staggerIndex?: number;
  staggerStepMs?: number;
  variant?: "up" | "scale" | "left" | "right" | "blur";
};

type ParallaxLayerProps = {
  children: ReactNode;
  className?: string;
  speed?: number;
};

export default function RevealOnView({
  children,
  className,
  delayMs = 0,
  threshold = 0.2,
  staggerIndex = 0,
  staggerStepMs = 70,
  variant = "up",
}: RevealOnViewProps) {
  const shouldReduceMotion = useReducedMotionPreference();

  const transitionDelay = useMemo(
    () => (delayMs + staggerIndex * staggerStepMs) / 1000,
    [delayMs, staggerIndex, staggerStepMs]
  );

  const fromByVariant = {
    up: { opacity: 0, y: 18 },
    scale: { opacity: 0, scale: 0.96, y: 10 },
    left: { opacity: 0, x: -20 },
    right: { opacity: 0, x: 20 },
    blur: { opacity: 0, y: 12, filter: "blur(8px)" },
  } as const;

  return (
    <motion.div
      className={cn(className)}
      initial={shouldReduceMotion ? false : fromByVariant[variant]}
      whileInView={
        shouldReduceMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
              x: 0,
              scale: 1,
              filter: "blur(0px)",
            }
      }
      viewport={{ once: true, amount: threshold }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: SERVICE_MOTION_TOKENS.revealDurationSeconds,
              delay: transitionDelay,
              ease: SERVICE_MOTION_TOKENS.easeCurve,
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function ParallaxLayer({ children, className, speed = 0.18 }: ParallaxLayerProps) {
  const reduceMotion = useReducedMotionPreference();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (value) => value * speed * -1);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}