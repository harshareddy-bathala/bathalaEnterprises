import AdminRouteLoading from "@/components/admin/admin-route-loading";

export default function Loading() {
  return (
    <AdminRouteLoading
      title="Loading dashboard"
      description="Fetching metrics, listings, and message summaries..."
    />
  );
}
