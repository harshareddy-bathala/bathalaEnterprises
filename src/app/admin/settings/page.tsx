"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/admin/image-upload";
import { supabase } from "@/lib/supabase-client";
import { getAdminUser } from "@/lib/admin-auth";
import {
  getSiteSettings,
  updateSiteSettings,
  getNotificationSettings,
  upsertNotificationSettings,
} from "@/lib/settings-queries";
import AdminLayout, { AdminCard, ErrorAlert, SuccessAlert, LoadingState } from "@/components/admin/admin-layout";
import type { SiteSettings, AdminNotificationSettings } from "@/types/tables";

type TabType = "general" | "profile" | "notifications";

const AVATAR_BUCKETS = ["testimonial-avatars", "property-images"] as const;
type AvatarBucket = (typeof AVATAR_BUCKETS)[number];
const PASSWORD_MIN_LENGTH = 10;

function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
}

function resolveAvatarStoragePath(publicUrl: string): { bucket: AvatarBucket; path: string } | null {
  for (const bucket of AVATAR_BUCKETS) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = publicUrl.indexOf(marker);
    if (markerIndex !== -1) {
      const path = publicUrl.slice(markerIndex + marker.length);
      if (path) {
        return { bucket, path };
      }
    }
  }

  return null;
}

async function removeAvatarFromStorage(publicUrl: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const resolvedPath = resolveAvatarStoragePath(publicUrl);
  if (!resolvedPath) {
    return;
  }

  const { error } = await supabase.storage
    .from(resolvedPath.bucket)
    .remove([resolvedPath.path]);

  if (error) {
    console.warn("Failed to remove previous avatar from storage:", error.message);
  }
}

async function uploadAvatarToStorage(file: File, userId: string): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client not initialized.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = ["jpg", "jpeg", "png", "webp"].includes(extension)
    ? extension
    : "jpg";
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  let lastErrorMessage = "";

  for (const bucket of AVATAR_BUCKETS) {
    const filePath = `admin-profiles/${userId}/${uniqueSuffix}.${safeExtension}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (!error) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
    }

    lastErrorMessage = error.message;
  }

  throw new Error(
    lastErrorMessage
      ? `Avatar upload failed: ${lastErrorMessage}`
      : "Avatar upload failed: no writable storage bucket is configured."
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Site settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] =
    useState<AdminNotificationSettings | null>(null);

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      if (!supabase) {
        console.error("Supabase client is not initialized for settings page.");
        setLoading(false);
        return;
      }

      const user = await getAdminUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const userMetadata = user.user_metadata || {};
      const inferredDisplayName =
        (typeof userMetadata.full_name === "string" && userMetadata.full_name.trim()) ||
        (typeof userMetadata.name === "string" && userMetadata.name.trim()) ||
        user.email?.split("@")[0] ||
        "Admin";

      setProfileName(inferredDisplayName);
      setProfileEmail(user.email || "");
      setProfileAvatarUrl(
        typeof userMetadata.avatar_url === "string" ? userMetadata.avatar_url : null
      );
      setAvatarFile(null);
      setAvatarMarkedForRemoval(false);

      setIsAuthenticated(true);
      setUserId(user.id);
      await fetchSettings(user.id);
    }

    void checkAuth();
  }, [router]);

  // Fetch all settings
  const fetchSettings = async (uid: string) => {
    try {
      setLoading(true);
      const [site, notifications] = await Promise.all([
        getSiteSettings(),
        getNotificationSettings(uid),
      ]);

      setSiteSettings(site);
      setNotificationSettings(notifications);
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelection = (file: File | null) => {
    setAvatarFile(file);

    if (file) {
      setAvatarMarkedForRemoval(false);
      return;
    }

    if (profileAvatarUrl) {
      setAvatarMarkedForRemoval(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!supabase || !userId) {
      setError("Supabase client is unavailable.");
      return;
    }

    const trimmedName = profileName.trim();
    if (trimmedName.length < 2) {
      setError("Display name must be at least 2 characters long.");
      return;
    }

    try {
      setProfileSaving(true);
      setError(null);
      setSuccess(null);

      let nextAvatarUrl = profileAvatarUrl;

      if (avatarFile) {
        const uploadedUrl = await uploadAvatarToStorage(avatarFile, userId);

        if (profileAvatarUrl && profileAvatarUrl !== uploadedUrl) {
          await removeAvatarFromStorage(profileAvatarUrl);
        }

        nextAvatarUrl = uploadedUrl;
      } else if (avatarMarkedForRemoval) {
        if (profileAvatarUrl) {
          await removeAvatarFromStorage(profileAvatarUrl);
        }

        nextAvatarUrl = null;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          name: trimmedName,
          avatar_url: nextAvatarUrl,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setProfileName(trimmedName);
      setProfileAvatarUrl(nextAvatarUrl);
      setAvatarFile(null);
      setAvatarMarkedForRemoval(false);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save profile settings");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!supabase) {
      setError("Supabase client is unavailable.");
      return;
    }

    if (!profileEmail) {
      setError("Unable to verify user email for password update.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    const passwordValidationError = validatePasswordStrength(newPassword);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }

    try {
      setPasswordSaving(true);
      setError(null);
      setSuccess(null);

      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: profileEmail,
        password: currentPassword,
      });

      if (reAuthError) {
        throw new Error("Current password is incorrect.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating password:", err);
      setError(err.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Save general settings
  const handleSaveGeneral = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!siteSettings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData(e.currentTarget);
      const normalizeOptional = (name: string): string | null => {
        const value = formData.get(name);
        if (typeof value !== "string") {
          return null;
        }

        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const nextSiteTitle =
        (typeof formData.get("site_title") === "string"
          ? (formData.get("site_title") as string).trim()
          : "") || siteSettings.site_title;

      const updates = {
        site_title: nextSiteTitle,
        phone: normalizeOptional("phone"),
        email: normalizeOptional("email"),
        address: normalizeOptional("address"),
        facebook_url: normalizeOptional("facebook_url"),
        twitter_url: normalizeOptional("twitter_url"),
        instagram_url: normalizeOptional("instagram_url"),
        linkedin_url: normalizeOptional("linkedin_url"),
      };

      await updateSiteSettings(siteSettings.id, updates);

      const refreshedSiteSettings = await getSiteSettings();
      if (refreshedSiteSettings) {
        setSiteSettings(refreshedSiteSettings);
      } else {
        setSiteSettings((current) =>
          current
            ? {
                ...current,
                ...updates,
                updated_at: new Date().toISOString(),
              }
            : current
        );
      }

      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Save notification settings
  const handleSaveNotifications = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData(e.currentTarget);
      await upsertNotificationSettings(userId, {
        email_notifications: formData.get("email_notifications") === "on",
        new_message_alerts: formData.get("new_message_alerts") === "on",
        daily_summary: formData.get("daily_summary") === "on",
        weekly_summary: formData.get("weekly_summary") === "on",
      });

      setSuccess("Notification settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: "general" as TabType, label: "General", icon: "tune" },
    { id: "profile" as TabType, label: "Profile", icon: "person" },
    { id: "notifications" as TabType, label: "Notifications", icon: "notifications" },
  ];

  return (
    <AdminLayout
      title="Settings"
      description="Manage your admin preferences and site configuration"
      adminName={profileName || "Admin"}
    >
      {/* Status Messages */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}

      {/* Tabs */}
      <div className="mb-6 border-b border-[#e5e2db]">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-[#b89a5e] text-[#b89a5e]"
                  : "border-transparent text-[#6b7280] hover:text-[#1a1f2e]"
              }`}
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <LoadingState message="Loading settings..." />
      ) : (
        <>
          {/* General Settings Tab */}
          {activeTab === "general" && siteSettings && (
            <AdminCard>
              <h2 className="mb-4 text-lg font-semibold text-[#1a1f2e]">General Settings</h2>
              <form
                key={siteSettings.updated_at || siteSettings.id}
                onSubmit={handleSaveGeneral}
                className="space-y-5"
              >
                <div className="relative">
                  <Input
                    id="site_title"
                    name="site_title"
                    defaultValue={siteSettings.site_title}
                    placeholder=" "
                    disabled={saving}
                    className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                  />
                  <Label htmlFor="site_title" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                    Site Title
                  </Label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="relative">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={siteSettings.phone || ""}
                      placeholder=" "
                      disabled={saving}
                      className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                    />
                    <Label htmlFor="phone" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                      Phone Number
                    </Label>
                  </div>

                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={siteSettings.email || ""}
                      placeholder=" "
                      disabled={saving}
                      className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                    />
                    <Label htmlFor="email" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                      Email Address
                    </Label>
                  </div>
                </div>

                <div className="relative">
                  <Textarea
                    id="address"
                    name="address"
                    defaultValue={siteSettings.address || ""}
                    placeholder=" "
                    rows={3}
                    disabled={saving}
                    className="peer pt-6 px-4 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e] resize-none"
                  />
                  <Label htmlFor="address" className="pointer-events-none absolute left-4 top-4 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                    Business Address
                  </Label>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1f2e]">Social Media Links</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <Input
                        id="facebook_url"
                        name="facebook_url"
                        type="url"
                        defaultValue={siteSettings.facebook_url || ""}
                        placeholder=" "
                        disabled={saving}
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                      />
                      <Label htmlFor="facebook_url" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                        Facebook URL
                      </Label>
                    </div>

                    <div className="relative">
                      <Input
                        id="twitter_url"
                        name="twitter_url"
                        type="url"
                        defaultValue={siteSettings.twitter_url || ""}
                        placeholder=" "
                        disabled={saving}
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                      />
                      <Label htmlFor="twitter_url" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                        Twitter URL
                      </Label>
                    </div>

                    <div className="relative">
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        type="url"
                        defaultValue={siteSettings.instagram_url || ""}
                        placeholder=" "
                        disabled={saving}
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                      />
                      <Label htmlFor="instagram_url" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                        Instagram URL
                      </Label>
                    </div>

                    <div className="relative">
                      <Input
                        id="linkedin_url"
                        name="linkedin_url"
                        type="url"
                        defaultValue={siteSettings.linkedin_url || ""}
                        placeholder=" "
                        disabled={saving}
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                      />
                      <Label htmlFor="linkedin_url" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                        LinkedIn URL
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-[#e8e4dc]">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </AdminCard>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <AdminCard>
                <h2 className="mb-4 text-lg font-semibold text-[#1a1f2e]">Profile Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div>
                      <Label>Avatar</Label>
                      <div className="mt-2">
                        <ImageUpload
                          value={profileAvatarUrl}
                          onChange={handleAvatarSelection}
                          disabled={profileSaving}
                          label="Upload Profile Photo"
                          maxSizeMB={2}
                          circular
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          id="profile_name"
                          value={profileName}
                          onChange={(event) => setProfileName(event.target.value)}
                          placeholder=" "
                          disabled={profileSaving}
                          className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                        />
                        <Label htmlFor="profile_name" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                          Display Name
                        </Label>
                      </div>

                      <div className="relative">
                        <Input
                          id="profile_email"
                          type="email"
                          value={profileEmail}
                          readOnly
                          placeholder=" "
                          disabled
                          className="peer pt-5 px-4 h-14 w-full rounded-xl cursor-not-allowed border-[#e8e4dc] bg-[#f8f6f2] text-[#6b7280] text-sm outline-none"
                        />
                        <Label htmlFor="profile_email" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                          Email Address
                        </Label>
                        <p className="mt-1 text-[11px] text-[#8b97a9]">
                          Email updates require secure verification via Supabase Auth.
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#e8e4dc] bg-[#fafaf8] px-4 py-3 text-xs text-[#6b7280]">
                        <p>
                          Avatar workflow: select a new image to replace the current one, or remove the preview to clear your avatar.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={profileSaving}>
                      {profileSaving ? "Saving Profile..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </AdminCard>

              <AdminCard>
                <h2 className="mb-4 text-lg font-semibold text-[#1a1f2e]">Password Update</h2>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="relative md:col-span-2">
                      <Input
                        id="current_password"
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder=" "
                        autoComplete="current-password"
                        disabled={passwordSaving}
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                      />
                      <Label htmlFor="current_password" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                        Current Password
                      </Label>
                    </div>

                    <div className="relative">
                      <Input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder=" "
                        autoComplete="new-password"
                        disabled={passwordSaving}
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                      />
                      <Label htmlFor="new_password" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                        New Password
                      </Label>
                    </div>

                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder=" "
                        autoComplete="new-password"
                        disabled={passwordSaving}
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                      />
                      <Label htmlFor="confirm_password" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-[12px] peer-focus:text-[10px] peer-focus:text-[#b89a5e] peer-focus:font-bold peer-focus:uppercase peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:uppercase">
                        Confirm New Password
                      </Label>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#e8e4dc] bg-[#fafaf8] px-4 py-3 text-xs text-[#6b7280]">
                    <p>Password requirements:</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>At least {PASSWORD_MIN_LENGTH} characters</li>
                      <li>One uppercase letter, one lowercase letter, one number, and one special character</li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={passwordSaving}>
                      {passwordSaving ? "Updating Password..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </AdminCard>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <AdminCard>
              <h2 className="mb-4 text-lg font-semibold text-[#1a1f2e]">Notification Preferences</h2>
              <form onSubmit={handleSaveNotifications} className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-[#e5e2db] p-4">
                  <div>
                    <div className="font-medium text-[#1a1f2e]">Email Notifications</div>
                    <div className="text-sm text-[#6b7280]">
                      Receive email notifications for important updates
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="email_notifications"
                    defaultChecked={notificationSettings?.email_notifications ?? true}
                    className="h-5 w-5 rounded border-[#e5e2db] text-[#b89a5e] focus:ring-[#b89a5e]"
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#e5e2db] p-4">
                  <div>
                    <div className="font-medium text-[#1a1f2e]">New Message Alerts</div>
                    <div className="text-sm text-[#6b7280]">
                      Get notified immediately when new messages arrive
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="new_message_alerts"
                    defaultChecked={notificationSettings?.new_message_alerts ?? true}
                    className="h-5 w-5 rounded border-[#e5e2db] text-[#b89a5e] focus:ring-[#b89a5e]"
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#e5e2db] p-4">
                  <div>
                    <div className="font-medium text-[#1a1f2e]">Daily Summary</div>
                    <div className="text-sm text-[#6b7280]">
                      Receive a daily summary of activity
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="daily_summary"
                    defaultChecked={notificationSettings?.daily_summary ?? false}
                    className="h-5 w-5 rounded border-[#e5e2db] text-[#b89a5e] focus:ring-[#b89a5e]"
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#e5e2db] p-4">
                  <div>
                    <div className="font-medium text-[#1a1f2e]">Weekly Summary</div>
                    <div className="text-sm text-[#6b7280]">
                      Receive a weekly summary of activity
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    name="weekly_summary"
                    defaultChecked={notificationSettings?.weekly_summary ?? true}
                    className="h-5 w-5 rounded border-[#e5e2db] text-[#b89a5e] focus:ring-[#b89a5e]"
                    disabled={saving}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </form>
            </AdminCard>
          )}
        </>
      )}
    </AdminLayout>
  );
}
