export type PropertyType = "Rent" | "Lease" | "Sale";
export type PropertyStatus = "active" | "inactive";
export type MessageStatus = "new" | "in-progress" | "resolved";
export type MessageQueryType = "properties" | "services";

export interface Admin {
  id: string;
  email: string;
  password_hash: string;
}

export interface Service {
  id: string;
  title: string;
  card_description?: string;       // Short one-liner for cards (max 180 chars)
  detailed_description?: string;   // Full description for modal
  icon_name?: string;
  icon?: string;
  price_range?: string;
  display_order: number;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  type: PropertyType;
  status: PropertyStatus;
  image_url?: string;
  thumbnail_url?: string;
  gallery_images?: string[];
  description?: string;
  map_location?: string;
  amenities?: string[];
  related_property_ids?: string[];
  bedrooms: number;
  sqft: number;
  created_at?: string;
  updated_at?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string | null;
  content: string;
  rating: number;
  avatar_url?: string | null;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SiteSettings {
  id: string;
  site_title: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  business_hours?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface AdminNotificationSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  new_message_alerts: boolean;
  daily_summary: boolean;
  weekly_summary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  service_type: string;
  status: MessageStatus;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  query_type: MessageQueryType;
  service_type?: string | null;
  message: string;
  status: MessageStatus;
  is_read: boolean;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}