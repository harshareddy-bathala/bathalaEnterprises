import PropertiesCarousel from "@/components/properties-carousel";
import { getPropertiesFromSupabase } from "@/lib/supabase-queries";

export const metadata = {
  title: "Properties | Bathala Enterprises"
};

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function PropertiesPage() {
  const properties = await getPropertiesFromSupabase();

  return (
    <PropertiesCarousel properties={properties} />
  );
}