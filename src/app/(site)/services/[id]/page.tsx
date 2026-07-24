import { permanentRedirect } from "next/navigation";

type LegacyServiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyServiceDetailPage({ params }: LegacyServiceDetailPageProps) {
  const { id } = await params;
  permanentRedirect(`/all-services/${id}`);
}
