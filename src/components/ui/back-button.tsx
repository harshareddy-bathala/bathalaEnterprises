"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export default function BackButton({ fallbackHref = "/", label = "Back", className }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleBack} className={className}>
      <span className="material-symbols-outlined text-base">arrow_back</span>
      {label}
    </Button>
  );
}
