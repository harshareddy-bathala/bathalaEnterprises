"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

type CountUpProps = {
  value: number;
  durationMs?: number;
  suffix?: string;
  className?: string;
};

export default function CountUp({ value, durationMs = 900, suffix = "", className }: CountUpProps) {
  const reduceMotion = useReducedMotionPreference();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (reduceMotion || startedRef.current) {
      setDisplay(value);
      return;
    }

    startedRef.current = true;
    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, reduceMotion]);

  return <span className={className}>{display}{suffix}</span>;
}
