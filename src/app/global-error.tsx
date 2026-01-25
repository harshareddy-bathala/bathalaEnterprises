"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center">
          <div className="rounded-full bg-red-100 p-6 mb-6">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">Application Error</h1>
          <p className="text-slate-600 mb-8 max-w-md">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
          <div className="flex gap-4">
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
          {error.digest && (
            <p className="mt-6 text-xs text-slate-400">Error ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
