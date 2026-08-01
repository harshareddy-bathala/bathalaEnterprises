"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase-client";
import { getAdminUser } from "@/lib/admin-auth";
import {
  getPropertiesFromSupabase,
  createProperty,
  updateProperty,
  deleteProperty,
  togglePropertyStatus,
} from "@/lib/supabase-queries";
import {
  uploadPropertyImage,
  deletePropertyImage,
} from "@/lib/image-upload";
import { BulkActionBar, SelectionCell, SortableTh, Table, TableEmptyState, TableSkeleton, Tbody, Td, Th, Thead, Tr } from "@/components/admin/table";
import AdminLayout, { AdminCard, ErrorAlert, LoadingState } from "@/components/admin/admin-layout";
import type { PropertyFormSubmitData } from "@/components/admin/property-form";
import type { Property } from "@/types/tables";
import { notifySearchEngines } from "@/lib/notify-search-engines";
import { propertyPath } from "@/lib/slug";
import type { RealtimeChannel } from "@supabase/supabase-js";

const Modal = dynamic(() => import("@/components/modal"), { loading: () => null });
const PropertyForm = dynamic(() => import("@/components/admin/property-form").then(mod => ({ default: mod.default })), { loading: () => null });
const ConfirmDialog = dynamic(() => import("@/components/admin/confirm-dialog"), { loading: () => null });

export default function PropertiesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // Form loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: "title" | "price" | "type" | "status"; direction: "asc" | "desc" }>({
    key: "title",
    direction: "asc",
  });

  const handleAdminError = (err: unknown, fallbackMessage: string): boolean => {
    const message = err instanceof Error ? err.message : fallbackMessage;
    const normalized = message.toLowerCase();
    const isSessionExpired =
      normalized.includes("permission") ||
      normalized.includes("not authorized") ||
      normalized.includes("unauthorized") ||
      normalized.includes("session") ||
      normalized.includes("token") ||
      normalized.includes("jwt");

    if (isSessionExpired) {
      setError("Your admin session has expired. Redirecting to login...");
      window.setTimeout(() => {
        router.push("/admin/login?reason=session-expired");
      }, 700);
      return true;
    }

    setError(message || fallbackMessage);
    return false;
  };

  const loadProperties = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getPropertiesFromSupabase(true);
      setProperties(data);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching properties:", err);
      handleAdminError(err, "Failed to load properties");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: RealtimeChannel | null = null;

    const initialize = async () => {
      if (!supabase) {
        router.push("/admin/login");
        return;
      }

      const adminUser = await getAdminUser();
      if (!adminUser) {
        router.push("/admin/login");
        return;
      }

      const nextAdminName =
        adminUser.user_metadata?.full_name ||
        adminUser.user_metadata?.name ||
        adminUser.email?.split("@")[0] ||
        "Admin";

      setAdminName(nextAdminName);

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(true);
      await loadProperties(true);

      if (!isMounted || !supabase) {
        return;
      }

      const client = supabase;
      channel = client
        .channel("properties-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "properties",
          },
          () => {
            void loadProperties();
          }
        )
        .subscribe();
    };

    void initialize();

    return () => {
      isMounted = false;
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadProperties, router]);

  // Handle create
  const handleCreate = async (
    data: PropertyFormSubmitData,
    imageFile: File | null,
    galleryFiles: File[]
  ) => {
    try {
      setIsSubmitting(true);

      const {
        existing_gallery_images: _existingGalleryImages,
        removed_gallery_images: _removedGalleryImages,
        ...propertyData
      } = data;

      // Upload main image if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        const uploadedUrl = await uploadPropertyImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Upload gallery images if provided
      let galleryUrls: string[] = [];
      if (galleryFiles.length > 0) {
        const uploadPromises = galleryFiles.map((file) =>
          uploadPropertyImage(file)
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        galleryUrls = uploadedUrls.filter((url): url is string => url !== null);
      }

      // Create property
      await createProperty({
        ...propertyData,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        gallery_images: galleryUrls,
      });

      await loadProperties();
      notifySearchEngines(["/properties", "/sitemap.xml"]);
      setIsCreateModalOpen(false);
      setError(null);
    } catch (err: unknown) {
      console.error("Error creating property:", err);
      handleAdminError(err, "Failed to create property");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = async (
    data: PropertyFormSubmitData,
    imageFile: File | null,
    galleryFiles: File[]
  ) => {
    if (!selectedProperty) return;

    try {
      setIsSubmitting(true);

      const {
        existing_gallery_images,
        removed_gallery_images,
        ...propertyData
      } = data;

      // Upload new main image if provided
      let imageUrl = selectedProperty.image_url;
      if (imageFile) {
        // Delete old image if exists
        if (selectedProperty.image_url) {
          await deletePropertyImage(selectedProperty.image_url);
        }

        const uploadedUrl = await uploadPropertyImage(imageFile, selectedProperty.id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      if (removed_gallery_images.length > 0) {
        await Promise.all(
          removed_gallery_images.map(async (url) => {
            await deletePropertyImage(url);
          })
        );
      }

      // Handle gallery images
      let galleryUrls = [...existing_gallery_images];
      
      // Upload new gallery images if provided
      if (galleryFiles.length > 0) {
        const uploadPromises = galleryFiles.map((file) =>
          uploadPropertyImage(file, selectedProperty.id)
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        const newUrls = uploadedUrls.filter((url): url is string => url !== null);
        galleryUrls = [...galleryUrls, ...newUrls];
      }

      // Update property
      await updateProperty(selectedProperty.id, {
        ...propertyData,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        gallery_images: galleryUrls,
      });

      await loadProperties();
      notifySearchEngines([
        "/properties",
        propertyPath(selectedProperty),
        "/sitemap.xml",
      ]);
      setIsEditModalOpen(false);
      setSelectedProperty(null);
      setError(null);
    } catch (err: unknown) {
      console.error("Error updating property:", err);
      handleAdminError(err, "Failed to update property");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setIsDeleting(true);

      // Delete image if exists
      if (propertyToDelete.image_url) {
        await deletePropertyImage(propertyToDelete.image_url);
      }

      if (propertyToDelete.gallery_images && propertyToDelete.gallery_images.length > 0) {
        await Promise.all(
          propertyToDelete.gallery_images.map(async (url) => {
            await deletePropertyImage(url);
          })
        );
      }

      // Delete property
      await deleteProperty(propertyToDelete.id);

      await loadProperties();
      setIsDeleteDialogOpen(false);
      setPropertyToDelete(null);
      setError(null);
    } catch (err: unknown) {
      console.error("Error deleting property:", err);
      handleAdminError(err, "Failed to delete property");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (property: Property) => {
    const previousProperties = properties;
    const newStatus = property.status === "active" ? "inactive" : "active";

    setProperties((current) =>
      current.map((item) => (item.id === property.id ? { ...item, status: newStatus } : item))
    );

    try {
      await togglePropertyStatus(property.id, newStatus);
      await loadProperties();
    } catch (err: unknown) {
      console.error("Error toggling status:", err);
      setProperties(previousProperties);
      handleAdminError(err, "Failed to update status");
    }
  };

  // Open edit modal
  const openEditModal = (property: Property) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (property: Property) => {
    setPropertyToDelete(property);
    setIsDeleteDialogOpen(true);
  };

  const sortedProperties = useMemo(() => {
    const list = [...properties];
    list.sort((a, b) => {
      const { key, direction } = sortConfig;
      const multiplier = direction === "asc" ? 1 : -1;

      if (key === "price") {
        return (a.price - b.price) * multiplier;
      }

      const aValue = String(a[key] || "").toLowerCase();
      const bValue = String(b[key] || "").toLowerCase();
      return aValue.localeCompare(bValue) * multiplier;
    });
    return list;
  }, [properties, sortConfig]);

  useEffect(() => {
    setSelectedPropertyIds((current) => current.filter((id) => properties.some((property) => property.id === id)));
  }, [properties]);

  const toggleSort = (key: "title" | "price" | "type" | "status") => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedPropertyIds(checked ? sortedProperties.map((property) => property.id) : []);
  };

  const toggleSelectOne = (propertyId: string, checked: boolean) => {
    setSelectedPropertyIds((current) => {
      if (checked) {
        return current.includes(propertyId) ? current : [...current, propertyId];
      }
      return current.filter((id) => id !== propertyId);
    });
  };

  const handleBulkDeactivate = async () => {
    try {
      await Promise.all(selectedPropertyIds.map((id) => updateProperty(id, { status: "inactive" })));
      setSelectedPropertyIds([]);
      await loadProperties();
    } catch (err: unknown) {
      handleAdminError(err, "Failed to update selected properties");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const relatedPropertyOptions = properties.map((property) => ({
    id: property.id,
    title: property.title,
    type: property.type,
    status: property.status,
  }));

  return (
    <AdminLayout
      title="Properties"
      description="Manage your property listings"
      adminName={adminName}
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => {
              void loadProperties(true);
            }}
            className="w-full sm:w-auto"
            disabled={loading}
          >
            <span className="material-symbols-outlined mr-2 text-lg" aria-hidden="true">refresh</span>
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <span className="material-symbols-outlined mr-2 text-lg" aria-hidden="true">add</span>
            Add Property
          </Button>
        </div>
      }
    >
      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Properties Table */}
      {loading ? (
        <TableSkeleton rowCount={6} colCount={7} />
      ) : properties.length === 0 ? (
        <AdminCard className="overflow-hidden p-0">
          <TableEmptyState
            icon="home_work"
            title="No properties yet"
            description="Create your first property listing to get started"
            action={
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                <span className="material-symbols-outlined mr-2 text-lg" aria-hidden="true">add</span>
                Add Property
              </Button>
            }
          />
        </AdminCard>
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <BulkActionBar selectedCount={selectedPropertyIds.length}>
            <Button variant="secondary" size="sm" onClick={() => setSelectedPropertyIds([])}>
              Clear
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkDeactivate}>
              Set Inactive
            </Button>
          </BulkActionBar>
          <div className="overflow-x-auto">
            <Table>
              <Thead className="bg-[#fafaf8]">
                <Tr className="border-b border-[var(--admin-border)]">
                  <Th className="w-12 pl-4 md:pl-5">
                    <SelectionCell
                      checked={sortedProperties.length > 0 && selectedPropertyIds.length === sortedProperties.length}
                      onChange={toggleSelectAll}
                      label="Select all properties"
                    />
                  </Th>
                  <SortableTh
                    active={sortConfig.key === "title"}
                    direction={sortConfig.direction}
                    onToggle={() => toggleSort("title")}
                    className="py-4"
                  >
                    Property
                  </SortableTh>
                  <Th priority="important" className="py-4">Type</Th>
                  <SortableTh
                    priority="important"
                    active={sortConfig.key === "price"}
                    direction={sortConfig.direction}
                    onToggle={() => toggleSort("price")}
                    className="py-4"
                  >
                    Price
                  </SortableTh>
                  <Th priority="optional" className="py-4">Gallery</Th>
                  <SortableTh
                    active={sortConfig.key === "status"}
                    direction={sortConfig.direction}
                    onToggle={() => toggleSort("status")}
                    className="py-4"
                  >
                    Status
                  </SortableTh>
                  <Th className="py-4 pr-4 md:pr-5 text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody className="divide-y divide-[var(--admin-border)] bg-white">
                {sortedProperties.map((property) => {
                  const isSelected = selectedPropertyIds.includes(property.id);
                  return (
                  <Tr key={property.id} className={cn("group transition-colors hover:bg-[#fcfaf7]", isSelected && "bg-[#fffaf0] hover:bg-[#fff5de]")}>
                    <Td className="pl-4 md:pl-5 align-middle">
                      <SelectionCell
                        checked={isSelected}
                        onChange={(checked) => toggleSelectOne(property.id, checked)}
                        label={`Select property ${property.title}`}
                      />
                    </Td>
                    <Td className="py-4 align-middle">
                      <div className="flex items-center gap-4">
                        {property.image_url ? (
                          <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[#faf9f6]">
                            <Image
                              src={property.image_url}
                              alt={property.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement?.classList.add('bg-[#f3f1ed]');
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[#faf9f6]">
                            <span className="material-symbols-outlined text-[var(--admin-text-muted)]" aria-hidden="true">imagesmode</span>
                          </div>
                        )}
                        <div className="flex flex-col justify-center min-w-0">
                          <span className="truncate font-semibold text-[var(--admin-text)] text-sm">{property.title}</span>
                          <span className="truncate text-xs font-medium text-[var(--admin-text-muted)] mt-0.5">{property.location}</span>
                          <div className="mt-1 flex items-center gap-2 sm:hidden text-[10px] font-bold uppercase tracking-wider">
                             <span className="text-[var(--admin-info)]">{property.type}</span>
                             <span className="text-[var(--admin-text)]">₹{property.price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td priority="important" className="py-4 align-middle">
                      <span className="inline-flex rounded-md bg-[#e8e4db] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text)]">
                        {property.type}
                      </span>
                    </Td>
                    <Td priority="important" className="py-4 align-middle font-bold text-[var(--admin-text)] tracking-tight">
                      ₹{property.price.toLocaleString()}
                    </Td>
                    <Td priority="optional" className="py-4 align-middle">
                      {property.gallery_images && property.gallery_images.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-[var(--admin-text-muted)]">
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">photo_library</span>
                          <span className="text-xs font-bold">{property.gallery_images.length}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-[var(--admin-border)]">—</span>
                      )}
                    </Td>
                    <Td className="py-4 align-middle">
                      <button
                        onClick={() => handleToggleStatus(property)}
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]",
                          property.status === "active"
                            ? "bg-[#ecfdf3] text-[#059669] hover:bg-[#d1fadf]"
                            : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", property.status === "active" ? "bg-[#10b981]" : "bg-[#9ca3af]")} />
                        {property.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </Td>
                    <Td className="py-4 pr-4 md:pr-5 text-right align-middle">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(property)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border)] hover:bg-[#faf9f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteDialog(property)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-[var(--admin-text-muted)] transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
                })}
              </Tbody>
            </Table>
          </div>
        </AdminCard>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Property"
        size="xl"
      >
        <PropertyForm
          relatedPropertyOptions={relatedPropertyOptions}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Property"
        size="xl"
      >
        {selectedProperty && (
          <PropertyForm
            initialData={selectedProperty}
            relatedPropertyOptions={relatedPropertyOptions}
            onSubmit={handleEdit}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Property"
        message={`Are you sure you want to delete "${propertyToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
