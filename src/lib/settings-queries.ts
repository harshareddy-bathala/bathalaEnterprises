import { supabase } from "@/lib/supabase-client";
import type { SiteSettings, AdminNotificationSettings } from "@/types/tables";

function getSupabaseOrThrow() {
  if (!supabase) {
    throw new Error(
      "Supabase client not initialized. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return supabase;
}

// ==========================================
// SITE SETTINGS
// ==========================================

/**
 * Get site settings (there should only be one row)
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (!supabase) {
    console.error("Supabase client not initialized while fetching site settings");
    return null;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching site settings:", error);
    return null;
  }

  return data;
}

/**
 * Update site settings
 */
export async function updateSiteSettings(
  id: string,
  updates: Partial<Omit<SiteSettings, "id" | "created_at" | "updated_at">>
): Promise<void> {
  const client = getSupabaseOrThrow();

  const { error } = await client
    .from("site_settings")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

// ==========================================
// ADMIN NOTIFICATION SETTINGS
// ==========================================

/**
 * Get notification settings for current user
 */
export async function getNotificationSettings(
  userId: string
): Promise<AdminNotificationSettings | null> {
  if (!supabase) {
    console.error("Supabase client not initialized while fetching notification settings");
    return null;
  }

  const { data, error } = await supabase
    .from("admin_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Error fetching notification settings:", error);
    return null;
  }

  return data;
}

/**
 * Create or update notification settings for user
 */
export async function upsertNotificationSettings(
  userId: string,
  settings: Partial<Omit<AdminNotificationSettings, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<void> {
  const client = getSupabaseOrThrow();

  const { error } = await client
    .from("admin_notification_settings")
    .upsert(
      {
        user_id: userId,
        ...settings,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw new Error(error.message);
  }
}

