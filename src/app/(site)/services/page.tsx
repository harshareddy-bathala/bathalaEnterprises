import { permanentRedirect } from "next/navigation";

export default function LegacyServicesPage() {
  permanentRedirect("/all-services");
}
