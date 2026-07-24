"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ChatbotWidget = dynamic(() => import("@/components/chatbot-widget"), {
  ssr: false,
  loading: () => null,
});

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export default function ChatbotDeferred() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const idleWindow = window as IdleWindow;
    const requestIdle = idleWindow.requestIdleCallback;
    const cancelIdle = idleWindow.cancelIdleCallback;

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    if (typeof requestIdle === "function") {
      idleId = requestIdle(() => setEnabled(true), { timeout: 3500 });
    } else {
      timeoutId = window.setTimeout(() => setEnabled(true), 2500);
    }

    return () => {
      if (idleId !== null && typeof cancelIdle === "function") {
        cancelIdle(idleId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <ChatbotWidget />;
}
