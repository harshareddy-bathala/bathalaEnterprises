import { supabase } from "@/lib/supabase-client";

export type Property = {
  id: string;
  title: string;
  location: string;
  bedrooms: number;
  sqft: number;
  price: number;
  type: "Rent" | "Lease" | "Sale";
  description?: string;
  image_url?: string;
  thumbnail_url?: string;
  gallery_images?: string[];
};

export type Service = {
  id: string;
  title: string;
  description: string;
  price_range?: string;
  icon?: string;
  icon_name?: string;
};

export async function getPropertiesFromSupabase(): Promise<Property[]> {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning empty data. Run SUPABASE_SETUP.sql to create tables.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("relations") || error.message.includes("does not exist")) {
        console.warn("Properties table not found. Run SUPABASE_SETUP.sql to create tables.", error.message);
      } else {
        console.error("Error fetching properties:", error);
      }
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      location: p.location || p.address,
      bedrooms: p.bedrooms,
      sqft: p.sqft,
      price: p.price,
      type: p.type,
      description: p.description,
      image_url: p.image_url,
      thumbnail_url: p.thumbnail_url || p.image_url,
      gallery_images: p.gallery_images || [],
    }));
  } catch (error: any) {
    if (error.message?.includes("Connect Timeout") || error.message?.includes("ECONNREFUSED")) {
      console.warn("Database connection timeout. Ensure SUPABASE_SETUP.sql has been run and tables exist.");
    } else {
      console.error("Failed to fetch properties:", error);
    }
    return [];
  }
}

export async function getServicesFromSupabase(): Promise<Service[]> {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning empty data. Run SUPABASE_SETUP.sql to create tables.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("relations") || error.message.includes("does not exist")) {
        console.warn("Services table not found. Run SUPABASE_SETUP.sql to create tables.", error.message);
      } else {
        console.error("Error fetching services:", error);
      }
      return [];
    }

    return (data || []).map((s: any) => ({
      id: s.id,
      title: s.title || s.name,
      description: s.description,
      price_range: s.price_range,
      icon: s.icon,
      icon_name: s.icon || s.icon_name, // Support both field names
    }));
  } catch (error: any) {
    if (error.message?.includes("Connect Timeout") || error.message?.includes("ECONNREFUSED")) {
      console.warn("Database connection timeout. Ensure SUPABASE_SETUP.sql has been run and tables exist.");
    } else {
      console.error("Failed to fetch services:", error);
    }
    return [];
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  if (!supabase) {
    console.warn("Supabase client not initialized");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.message.includes("relations") || error.message.includes("does not exist")) {
        console.warn("Properties table not found. Run SUPABASE_SETUP.sql to create tables.");
      } else {
        console.error("Error fetching property:", error);
      }
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      location: data.location || data.address,
      bedrooms: data.bedrooms,
      sqft: data.sqft,
      price: data.price,
      type: data.type,
      description: data.description,
      image_url: data.image_url,
      thumbnail_url: data.thumbnail_url || data.image_url,
      gallery_images: data.gallery_images || [],
    };
  } catch (error) {
    console.error("Failed to fetch property:", error);
    return null;
  }
}
