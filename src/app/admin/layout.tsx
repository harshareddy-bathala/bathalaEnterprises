import type { ReactNode } from "react";

export const metadata = {
  title: "Admin | Bathala Enterprises"
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="container-wide space-y-10 pt-6 pb-12">{children}</div>;
}