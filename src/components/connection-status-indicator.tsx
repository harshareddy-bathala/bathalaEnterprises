"use client";

import { useSyncExternalStore } from "react";

function subscribeToOnlineStatus(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineStatusSnapshot(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

function getServerOnlineStatusSnapshot(): boolean {
  return true;
}

export default function ConnectionStatusIndicator() {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatusSnapshot,
    getServerOnlineStatusSnapshot
  );

  if (isOnline) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] max-w-[calc(100vw-2rem)]">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm">
        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
        <span>Offline</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-1 rounded-full border border-red-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
