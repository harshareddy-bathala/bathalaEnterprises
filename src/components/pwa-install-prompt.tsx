"use client";

import { useEffect, useState } from "react";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

const DISMISS_KEY = "bathala-pwa-install-dismissed";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "true");

    if (process.env.NODE_ENV !== "production") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            void registration.unregister();
          });
        });
      }

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.startsWith("bathala-")) {
              void caches.delete(key);
            }
          });
        });
      }

      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failure should not block page interactions.
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "true");
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (!deferredPrompt || installed || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[min(92vw,320px)] rounded-xl border border-[#e8e4dc] bg-white p-3 shadow-[0_8px_28px_rgba(0,0,0,0.14)]">
      <p className="text-sm font-semibold text-[#1a1f2e]">Install Bathala App</p>
      <p className="mt-1 text-xs leading-[1.5] text-[#6b7280]">
        Get faster repeat visits and offline access to key pages.
      </p>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex min-h-[40px] items-center rounded-md border border-[#e8e4dc] px-3 text-xs font-semibold text-[#4a5568]"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="inline-flex min-h-[40px] items-center rounded-md bg-[#b89a5e] px-3 text-xs font-semibold text-[#2c3340]"
        >
          Install
        </button>
      </div>
    </div>
  );
}
