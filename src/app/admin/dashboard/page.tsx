"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, LogOut, X, Save, AlertCircle, CheckCircle, Loader2, ShieldCheck, Wrench, Sparkles, BriefcaseBusiness, Home, Building, Key, Users, FileText, Landmark, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

// Icon options for services
const ICON_OPTIONS = [
  { name: "ShieldCheck", label: "Shield Check", icon: ShieldCheck },
  { name: "Wrench", label: "Maintenance", icon: Wrench },
  { name: "Sparkles", label: "Premium", icon: Sparkles },
  { name: "BriefcaseBusiness", label: "Business", icon: BriefcaseBusiness },
  { name: "Home", label: "Home", icon: Home },
  { name: "Building", label: "Building", icon: Building },
  { name: "Key", label: "Key", icon: Key },
  { name: "Users", label: "Users", icon: Users },
  { name: "FileText", label: "Documents", icon: FileText },
  { name: "Landmark", label: "Landmark", icon: Landmark },
];

type Property = {
  id: string;
  title: string;
  location: string;
  bedrooms: number;
  sqft: number;
  price: number;
  type: "Rent" | "Lease" | "Sale";
  description: string;
  image_url: string;
  thumbnail_url: string;
  gallery_images: string[];
};

type Service = {
  id: string;
  title: string;
  description: string;
  price_range: string;
  icon: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"properties" | "services">("properties");
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    location: string;
    bedrooms: number;
    sqft: number;
    price: number;
    type: "Rent" | "Lease" | "Sale";
    description: string;
    image_url: string;
    thumbnail_url: string;
    gallery_images: string[];
  }>({
    title: "",
    location: "",
    bedrooms: 1,
    sqft: 1000,
    price: 0,
    type: "Rent",
    description: "",
    image_url: "",
    thumbnail_url: "",
    gallery_images: [],
  });

  const [galleryInput, setGalleryInput] = useState("");

  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    price_range: "",
    icon: "",
  });

  // Check authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      // Require Supabase authentication
      if (!supabase) {
        console.error("Supabase not configured. Admin access requires proper authentication.");
        router.push("/admin/login");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/admin/login");
        return;
      }
      // Verify user has admin role
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.user_metadata?.is_admin) {
        router.push("/admin/login");
        return;
      }
      
      setIsAuthenticated(true);
      await loadData();
    };

    checkAuth();
  }, [router]);

  const loadData = async () => {
    try {
      await Promise.all([loadProperties(), loadServices()]);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message.includes("relations") || error.message.includes("does not exist")) {
          showNotification("error", "Properties table not found. Run SUPABASE_SETUP.sql first.");
        } else {
          throw error;
        }
        return;
      }

      setProperties(
        (data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          location: p.location,
          bedrooms: p.bedrooms,
          sqft: p.sqft,
          price: p.price,
          type: p.type,
          description: p.description,
          image_url: p.image_url,
          thumbnail_url: p.thumbnail_url || p.image_url,
          gallery_images: p.gallery_images || [],
        }))
      );
    } catch (error: any) {
      if (error.message?.includes("Connect Timeout")) {
        showNotification("error", "Database connection timeout. Ensure SUPABASE_SETUP.sql has been run.");
      } else {
        console.error("Error loading properties:", error);
        showNotification("error", "Failed to load properties");
      }
    }
  };

  const loadServices = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message.includes("relations") || error.message.includes("does not exist")) {
          showNotification("error", "Services table not found. Run SUPABASE_SETUP.sql first.");
        } else {
          throw error;
        }
        return;
      }

      setServices(
        (data || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          price_range: s.price_range,
          icon: s.icon,
        }))
      );
    } catch (error: any) {
      if (error.message?.includes("Connect Timeout")) {
        showNotification("error", "Database connection timeout. Ensure SUPABASE_SETUP.sql has been run.");
      } else {
        console.error("Error loading services:", error);
        showNotification("error", "Failed to load services");
      }
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File, folder: string = "properties"): Promise<string | null> => {
    if (!supabase) {
      showNotification("error", "Supabase not initialized");
      return null;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      showNotification("error", "Invalid file type. Use JPG, PNG, WebP, or GIF.");
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "File too large. Maximum size is 5MB.");
      return null;
    }

    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Upload error:", error);
        if (error.message.includes("Bucket not found")) {
          showNotification("error", "Storage bucket not configured. Run SUPABASE_ALTER_TABLE.sql first.");
        } else {
          showNotification("error", `Upload failed: ${error.message}`);
        }
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      showNotification("error", "Failed to upload image");
      return null;
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress("Uploading thumbnail...");

    const url = await uploadImage(file, "thumbnails");
    if (url) {
      setFormData({ ...formData, thumbnail_url: url, image_url: url });
      showNotification("success", "Thumbnail uploaded successfully");
    }

    setIsUploading(false);
    setUploadProgress("");
    e.target.value = ""; // Reset input
  };

  // Handle gallery images upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Uploading image ${i + 1} of ${files.length}...`);
      const url = await uploadImage(files[i], "gallery");
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData({
        ...formData,
        gallery_images: [...formData.gallery_images, ...uploadedUrls],
      });
      showNotification("success", `${uploadedUrls.length} image(s) uploaded successfully`);
    }

    setIsUploading(false);
    setUploadProgress("");
    e.target.value = ""; // Reset input
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
  };

  const handleAddProperty = () => {
    setEditingId(null);
    setFormData({
      title: "",
      location: "",
      bedrooms: 1,
      sqft: 1000,
      price: 0,
      type: "Rent",
      description: "",
      image_url: "",
      thumbnail_url: "",
      gallery_images: [],
    });
    setGalleryInput("");
    setIsCreating(true);
  };

  const handleSaveProperty = async () => {
    if (!formData.title || !formData.location) {
      showNotification("error", "Please fill in required fields");
      return;
    }

    if (!supabase) {
      showNotification("error", "Supabase not initialized");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("properties")
          .update({
            title: formData.title,
            location: formData.location,
            bedrooms: formData.bedrooms,
            sqft: formData.sqft,
            price: formData.price,
            type: formData.type,
            description: formData.description,
            image_url: formData.image_url,
            thumbnail_url: formData.thumbnail_url || formData.image_url,
            gallery_images: formData.gallery_images,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
        showNotification("success", "Property updated successfully");
      } else {
        const { error } = await supabase.from("properties").insert([
          {
            title: formData.title,
            location: formData.location,
            bedrooms: formData.bedrooms,
            sqft: formData.sqft,
            price: formData.price,
            type: formData.type,
            description: formData.description,
            image_url: formData.image_url,
            thumbnail_url: formData.thumbnail_url || formData.image_url,
            gallery_images: formData.gallery_images,
          },
        ]);

        if (error) throw error;
        showNotification("success", "Property added successfully");
      }

      await loadProperties();
      setIsCreating(false);
      setEditingId(null);
      setFormData({
        title: "",
        location: "",
        bedrooms: 1,
        sqft: 1000,
        price: 0,
        type: "Rent",
        description: "",
        image_url: "",
        thumbnail_url: "",
        gallery_images: [],
      });
      setGalleryInput("");
    } catch (error) {
      console.error("Error saving property:", error);
      showNotification("error", "Failed to save property");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProperty = (prop: Property) => {
    setFormData({
      title: prop.title,
      location: prop.location,
      bedrooms: prop.bedrooms,
      sqft: prop.sqft,
      price: prop.price,
      type: prop.type as "Rent" | "Lease" | "Sale",
      description: prop.description,
      image_url: prop.image_url,
      thumbnail_url: prop.thumbnail_url || prop.image_url,
      gallery_images: prop.gallery_images || [],
    });
    setGalleryInput("");
    setEditingId(prop.id);
    setIsCreating(true);
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    if (!supabase) return;

    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;
      showNotification("success", "Property deleted successfully");
      await loadProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      showNotification("error", "Failed to delete property");
    }
  };

  const handleAddService = () => {
    setServiceForm({ title: "", description: "", price_range: "", icon: "" });
    setEditingId(null);
    setIsCreating(true);
    setActiveTab("services");
  };

  const handleSaveService = async () => {
    if (!serviceForm.title || !serviceForm.description) {
      showNotification("error", "Please fill in required fields");
      return;
    }

    if (!supabase) {
      showNotification("error", "Supabase not initialized");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("services")
          .update({
            title: serviceForm.title,
            description: serviceForm.description,
            price_range: serviceForm.price_range,
            icon: serviceForm.icon,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
        showNotification("success", "Service updated successfully");
      } else {
        const { error } = await supabase.from("services").insert([
          {
            title: serviceForm.title,
            description: serviceForm.description,
            price_range: serviceForm.price_range,
            icon: serviceForm.icon,
          },
        ]);

        if (error) throw error;
        showNotification("success", "Service added successfully");
      }

      await loadServices();
      setIsCreating(false);
      setEditingId(null);
      setServiceForm({ title: "", description: "", price_range: "", icon: "" });
    } catch (error) {
      console.error("Error saving service:", error);
      showNotification("error", "Failed to save service");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditService = (svc: Service) => {
    setServiceForm(svc);
    setEditingId(svc.id);
    setIsCreating(true);
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    if (!supabase) return;

    try {
      const { error } = await supabase.from("services").delete().eq("id", id);

      if (error) throw error;
      showNotification("success", "Service deleted successfully");
      await loadServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      showNotification("error", "Failed to delete service");
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 rounded-lg p-4 flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{notification.message}</span>
        </motion.div>
      )}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between border-b border-slate-200 pb-6"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-royal">Admin</p>
          <h1 className="text-3xl font-black text-slate-900">Content Manager</h1>
          <p className="text-slateInk">Manage properties and services from Supabase</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="secondary"
          size="sm"
          className="gap-2 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </motion.header>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 border-b border-slate-200"
      >
        <button
          onClick={() => setActiveTab("properties")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "properties"
              ? "text-royal border-b-2 border-royal"
              : "text-slateInk hover:text-slate-900"
          }`}
        >
          Properties ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "services"
              ? "text-royal border-b-2 border-royal"
              : "text-slateInk hover:text-slate-900"
          }`}
        >
          Services ({services.length})
        </button>
      </motion.div>

      {/* Create/Edit Modal */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsCreating(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId
                  ? `Edit ${activeTab === "properties" ? "Property" : "Service"}`
                  : `New ${activeTab === "properties" ? "Property" : "Service"}`}
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-4">
                {activeTab === "properties" ? (
                  <>
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Property name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="e.g., Koramangala, Bangalore"
                      />
                      <p className="text-xs text-slateInk mt-1">Enter area name for map preview below</p>
                      
                      {/* Map Preview */}
                      {formData.location && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Map Preview</Label>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location + ', Bangalore')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-royal hover:underline"
                            >
                              Open in Google Maps ↗
                            </a>
                          </div>
                          <div className="rounded-lg overflow-hidden border border-slate-200 h-40">
                            <iframe
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.location)},bangalore&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              className="w-full h-full border-0"
                              loading="lazy"
                              title="Location preview"
                            />
                          </div>
                          <p className="text-xs text-amber-600">
                            💡 If location is not accurate, try adding more details like &quot;Near [landmark]&quot; or full address
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          value={formData.bedrooms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bedrooms: parseInt(e.target.value),
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sqft">Sq Ft</Label>
                        <Input
                          id="sqft"
                          type="number"
                          value={formData.sqft}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sqft: parseInt(e.target.value),
                            })
                          }
                          min="100"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price: parseFloat(e.target.value),
                            })
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <select
                          id="type"
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              type: e.target.value as "Rent" | "Lease" | "Sale",
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal"
                        >
                          <option value="Rent">Rent</option>
                          <option value="Lease">Lease</option>
                          <option value="Sale">Sale</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Property description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="thumbnail">Thumbnail Image *</Label>
                      <div className="mt-2 space-y-3">
                        {/* Current thumbnail preview */}
                        {formData.thumbnail_url && (
                          <div className="relative inline-block">
                            <img
                              src={formData.thumbnail_url}
                              alt="Thumbnail preview"
                              className="h-24 w-32 object-cover rounded-lg border-2 border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='96'%3E%3Crect fill='%23e2e8f0' width='128' height='96'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, thumbnail_url: "", image_url: "" })}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {/* Upload button */}
                        <div className="flex items-center gap-3">
                          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition ${isUploading ? 'bg-slate-100 border-slate-300' : 'border-royal/50 hover:border-royal hover:bg-royal/5'}`}>
                            <Upload className="h-4 w-4 text-royal" />
                            <span className="text-sm font-medium text-royal">
                              {isUploading ? uploadProgress : (formData.thumbnail_url ? "Change Image" : "Upload Thumbnail")}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleThumbnailUpload}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                          {isUploading && <Loader2 className="h-4 w-4 animate-spin text-royal" />}
                        </div>
                        <p className="text-xs text-slateInk">Main image shown in property cards. Max 5MB (JPG, PNG, WebP)</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="gallery">Gallery Images</Label>
                      <div className="mt-2 space-y-3">
                        {/* Upload button */}
                        <div className="flex items-center gap-3">
                          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition ${isUploading ? 'bg-slate-100 border-slate-300' : 'border-purple/50 hover:border-purple hover:bg-purple/5'}`}>
                            <ImageIcon className="h-4 w-4 text-purple" />
                            <span className="text-sm font-medium text-purple">
                              {isUploading ? uploadProgress : "Add Gallery Images"}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              multiple
                              onChange={handleGalleryUpload}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                          {isUploading && <Loader2 className="h-4 w-4 animate-spin text-purple" />}
                        </div>
                        <p className="text-xs text-slateInk">Select multiple images for the gallery. Max 5MB each.</p>
                        
                        {/* Gallery preview */}
                        {formData.gallery_images.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-700">Gallery ({formData.gallery_images.length} images):</p>
                            <div className="flex flex-wrap gap-2">
                              {formData.gallery_images.map((img, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={img}
                                    alt={`Gallery ${idx + 1}`}
                                    className="h-16 w-16 object-cover rounded-lg border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23e2e8f0' width='64' height='64'/%3E%3C/svg%3E";
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        gallery_images: formData.gallery_images.filter((_, i) => i !== idx),
                                      });
                                    }}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="svc-title">Title *</Label>
                      <Input
                        id="svc-title"
                        value={serviceForm.title}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            title: e.target.value,
                          })
                        }
                        placeholder="Service name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="svc-description">Description *</Label>
                      <Textarea
                        id="svc-description"
                        value={serviceForm.description}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Service description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="svc-price">Price Range</Label>
                      <Input
                        id="svc-price"
                        value={serviceForm.price_range}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            price_range: e.target.value,
                          })
                        }
                        placeholder="e.g., ₹500 - ₹2000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="svc-icon">Icon</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {ICON_OPTIONS.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <button
                              key={option.name}
                              type="button"
                              onClick={() =>
                                setServiceForm({
                                  ...serviceForm,
                                  icon: option.name,
                                })
                              }
                              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                                serviceForm.icon === option.name
                                  ? "border-royal bg-royal/10"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                              title={option.label}
                            >
                              <IconComponent className="h-5 w-5 text-royal" />
                              <span className="text-[10px] text-slate-600">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() =>
                      activeTab === "properties"
                        ? handleSaveProperty()
                        : handleSaveService()
                    }
                    disabled={isSaving}
                    className="flex-1 gap-2 bg-royal hover:bg-royal/90 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => setIsCreating(false)}
                    variant="secondary"
                    className="flex-1"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {activeTab === "properties" && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-slate-900">Preview</h3>
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white hover:shadow-lg transition h-fit">
                    {formData.image_url ? (
                      <div className="h-48 bg-gradient-to-br from-royal/20 to-pink/20 flex items-center justify-center">
                        <img
                          src={formData.image_url}
                          alt={formData.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-royal/20 to-pink/20 flex items-center justify-center text-slate-400">
                        No image
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">
                          {formData.title || "Property Name"}
                        </h3>
                        <p className="text-sm text-slateInk">
                          {formData.location || "Location"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-royal/10 text-royal">
                          {formData.bedrooms} Bed
                        </Badge>
                        <Badge className="bg-pink/10 text-pink">
                          {formData.sqft.toLocaleString()} Sq Ft
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-bold text-xl text-slate-900">
                          ₹{formData.price.toLocaleString('en-IN')}
                        </span>
                        <Badge className="bg-slate-200 text-slate-700">{formData.type}</Badge>
                      </div>
                      <p className="text-sm text-slateInk">
                        {formData.description || "Property description"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "services" && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-slate-900">Preview</h3>
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white/80 to-purple/5 p-6 text-center space-y-3 h-fit">
                    <div className="flex justify-center">
                      {(() => {
                        const IconOption = ICON_OPTIONS.find(opt => opt.name === serviceForm.icon);
                        const IconComponent = IconOption?.icon || Sparkles;
                        return (
                          <div className="rounded-2xl bg-gradient-to-br from-royal/10 to-purple/10 p-4">
                            <IconComponent className="h-8 w-8 text-royal" />
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">
                        {serviceForm.title || "Service Name"}
                      </h3>
                      <p className="text-sm text-slateInk mt-2">
                        {serviceForm.description || "Service description"}
                      </p>
                    </div>
                    {serviceForm.price_range && (
                      <p className="text-royal font-semibold pt-2">
                        {serviceForm.price_range}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Properties Content */}
      {activeTab === "properties" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              All Properties ({properties.length})
            </h2>
            <Button
              onClick={handleAddProperty}
              className="gap-2 bg-royal hover:bg-royal/90 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-slate-200 overflow-hidden bg-white hover:shadow-lg transition"
              >
                {prop.image_url && (
                  <div className="h-40 bg-gradient-to-br from-royal/20 to-pink/20">
                    <img
                      src={prop.image_url}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{prop.title}</h3>
                    <p className="text-sm text-slateInk">{prop.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-royal/10 text-royal text-xs">
                      {prop.bedrooms} Bed
                    </Badge>
                    <Badge className="bg-pink/10 text-pink text-xs">
                      {prop.sqft.toLocaleString()} Sq Ft
                    </Badge>
                    <Badge className="bg-slate-200 text-slate-700 text-xs">
                      {prop.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-slate-900">
                      ₹{prop.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleEditProperty(prop)}
                      size="sm"
                      variant="secondary"
                      className="flex-1 gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteProperty(prop.id)}
                      size="sm"
                      variant="secondary"
                      className="flex-1 gap-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {properties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slateInk mb-4">No properties yet</p>
              <Button
                onClick={handleAddProperty}
                className="gap-2 bg-royal hover:bg-royal/90 text-white"
              >
                <Plus className="h-4 w-4" />
                Add First Property
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Services Content */}
      {activeTab === "services" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              All Services ({services.length})
            </h2>
            <Button
              onClick={handleAddService}
              className="gap-2 bg-royal hover:bg-royal/90 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => {
              const IconOption = ICON_OPTIONS.find(opt => opt.name === svc.icon);
              const IconComponent = IconOption?.icon || Sparkles;
              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-slate-200 bg-gradient-to-br from-white/80 to-purple/5 p-6 text-center space-y-3 hover:shadow-lg transition"
                >
                  <div className="flex justify-center">
                    <div className="rounded-2xl bg-gradient-to-br from-royal/10 to-purple/10 p-3">
                      <IconComponent className="h-6 w-6 text-royal" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{svc.title}</h3>
                    <p className="text-sm text-slateInk mt-2">
                      {svc.description}
                    </p>
                  </div>
                  {svc.price_range && (
                    <p className="text-royal font-semibold">{svc.price_range}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleEditService(svc)}
                      size="sm"
                      variant="secondary"
                      className="flex-1 gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteService(svc.id)}
                      size="sm"
                      variant="secondary"
                      className="flex-1 gap-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {services.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slateInk mb-4">No services yet</p>
              <Button
                onClick={handleAddService}
                className="gap-2 bg-royal hover:bg-royal/90 text-white"
              >
                <Plus className="h-4 w-4" />
                Add First Service
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
