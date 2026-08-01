import type { ReactNode } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  // The root layout's title template appends " | Bathala Enterprises".
  title: "Admin",
  // robots.txt disallow is a crawl directive, not an indexing guarantee — the
  // admin surface needs an explicit noindex too.
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bathala-admin-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,154,94,0.16),transparent_42%)]" />
      <div className="relative min-h-screen">{children}</div>
    </div>
  );
}