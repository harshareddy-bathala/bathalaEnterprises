import type { ReactNode } from "react";

export const metadata = {
  title: "Admin | Bathala Enterprises"
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bathala-admin-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,154,94,0.16),transparent_42%)]" />
      <div className="relative min-h-screen">{children}</div>
    </div>
  );
}