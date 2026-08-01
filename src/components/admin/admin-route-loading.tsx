import UniversalLoading from "@/components/ui/universal-loading";

type AdminRouteLoadingProps = {
  title?: string;
  description?: string;
};

export default function AdminRouteLoading({
  title = "Loading admin view",
  description = "Preparing dashboard data and controls...",
}: AdminRouteLoadingProps) {
  return <UniversalLoading message={title} detail={description} />;
}
