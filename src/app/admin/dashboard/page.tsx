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
import { Plus, Edit, Trash2, LogOut, X, Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

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
  }>({
    title: "",
    location: "",
    bedrooms: 1,
    sqft: 1000,
    price: 0,
    type: "Rent",
    description: "",
    image_url: "",
  });

  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    price_range: "",
    icon: "",
  });

  // Check authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      // Check Supabase session first
      if (supabase) {
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
      } else {
        // Fallback to localStorage for demo mode
        const isAuth = localStorage.getItem("admin_auth");
        if (!isAuth) {
          router.push("/admin/login");
          return;
        }
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

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_email");
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
    });
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
      });
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
    });
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
                        placeholder="City, State"
                      />
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
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        value={formData.image_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            image_url: e.target.value,
                          })
                        }
                        placeholder="https://example.com/image.jpg"
                      />
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
                        placeholder="e.g., $500 - $2000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="svc-icon">Icon (Emoji)</Label>
                      <Input
                        id="svc-icon"
                        value={serviceForm.icon}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            icon: e.target.value,
                          })
                        }
                        placeholder="🏠"
                      />
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
                          ${formData.price.toLocaleString()}
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
                    <div className="text-4xl">
                      {serviceForm.icon || "🏠"}
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
                      ${prop.price.toLocaleString()}
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
            {services.map((svc) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-white/80 to-purple/5 p-6 text-center space-y-3 hover:shadow-lg transition"
              >
                <div className="text-4xl">{svc.icon}</div>
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
            ))}
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
