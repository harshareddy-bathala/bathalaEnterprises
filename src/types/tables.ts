export type PropertyType = "Rent" | "Lease" | "Sale";

export interface Admin {
  id: string;
  email: string;
  password_hash: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon_name?: string;
  icon?: string;
  price_range?: string;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  type: PropertyType;
  image_url?: string;
  thumbnail_url?: string;
  gallery_images?: string[];
  description?: string;
  bedrooms: number;
  sqft: number;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  service_type: string;
  status: "new" | "in-progress" | "resolved";
}