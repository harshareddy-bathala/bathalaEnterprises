"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";
import { getAdminUser } from "@/lib/admin-auth";
import {
  getTestimonialsFromSupabase,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  MAX_FEATURED_TESTIMONIALS,
  toggleTestimonialFeatured,
} from "@/lib/supabase-queries";
import {
  uploadTestimonialAvatar,
  deleteTestimonialAvatar,
} from "@/lib/image-upload";
import { BulkActionBar, SelectionCell, SortableTh, Table, TableEmptyState, TableSkeleton, Tbody, Td, Th, Thead, Tr } from "@/components/admin/table";
import AdminLayout, { AdminCard, ErrorAlert } from "@/components/admin/admin-layout";
import type { Testimonial } from "@/types/tables";

const Modal = dynamic(() => import("@/components/modal"), { loading: () => null });
const TestimonialForm = dynamic(() => import("@/components/admin/testimonial-form"), { loading: () => null });
const ConfirmDialog = dynamic(() => import("@/components/admin/confirm-dialog"), { loading: () => null });

// Type for testimonial form data
type TestimonialFormData = {
  name: string;
  role?: string;
  content: string;
  rating: number;
  featured: boolean;
};

export default function TestimonialsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  // Form loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTestimonialIds, setSelectedTestimonialIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: "name" | "rating" | "featured"; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });

  const loadTestimonials = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getTestimonialsFromSupabase();
      setTestimonials(data);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching testimonials:", err);
      setError(err instanceof Error ? err.message : "Failed to load testimonials");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

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
      await loadTestimonials(true);

      if (!isMounted || !supabase) {
        return;
      }

      const client = supabase;
      channel = client
        .channel("testimonials-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "testimonials",
          },
          () => {
            void loadTestimonials();
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
  }, [loadTestimonials, router]);

  // Handle create
  const handleCreate = async (data: TestimonialFormData, avatarFile: File | null) => {
    try {
      if (data.featured && featuredTestimonialsCount >= MAX_FEATURED_TESTIMONIALS) {
        setError(
          `Only ${MAX_FEATURED_TESTIMONIALS} testimonials can be featured. Unfeature one before adding another.`
        );
        return;
      }

      setIsSubmitting(true);

      // Upload avatar if provided
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const uploadedUrl = await uploadTestimonialAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Create testimonial
      await createTestimonial({
        ...data,
        avatar_url: avatarUrl,
      });

      await loadTestimonials();
      setIsCreateModalOpen(false);
      setError(null);
    } catch (err: unknown) {
      console.error("Error creating testimonial:", err);
      setError(err instanceof Error ? err.message : "Failed to create testimonial");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = async (data: TestimonialFormData, avatarFile: File | null) => {
    if (!selectedTestimonial) return;

    try {
      if (
        data.featured &&
        !selectedTestimonial.featured &&
        featuredTestimonialsCount >= MAX_FEATURED_TESTIMONIALS
      ) {
        setError(
          `Only ${MAX_FEATURED_TESTIMONIALS} testimonials can be featured. Unfeature one before featuring this testimonial.`
        );
        return;
      }

      setIsSubmitting(true);

      // Upload new avatar if provided
      let avatarUrl = selectedTestimonial.avatar_url;
      if (avatarFile) {
        // Delete old avatar if exists
        if (selectedTestimonial.avatar_url) {
          await deleteTestimonialAvatar(selectedTestimonial.avatar_url);
        }

        const uploadedUrl = await uploadTestimonialAvatar(
          avatarFile,
          selectedTestimonial.id
        );
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Update testimonial
      await updateTestimonial(selectedTestimonial.id, {
        ...data,
        avatar_url: avatarUrl,
      });

      await loadTestimonials();
      setIsEditModalOpen(false);
      setSelectedTestimonial(null);
      setError(null);
    } catch (err: unknown) {
      console.error("Error updating testimonial:", err);
      setError(err instanceof Error ? err.message : "Failed to update testimonial");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!testimonialToDelete) return;

    try {
      setIsDeleting(true);

      // Delete avatar if exists
      if (testimonialToDelete.avatar_url) {
        await deleteTestimonialAvatar(testimonialToDelete.avatar_url);
      }

      // Delete testimonial
      await deleteTestimonial(testimonialToDelete.id);

      await loadTestimonials();
      setIsDeleteDialogOpen(false);
      setTestimonialToDelete(null);
      setError(null);
    } catch (err: unknown) {
      console.error("Error deleting testimonial:", err);
      setError(err instanceof Error ? err.message : "Failed to delete testimonial");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle featured toggle
  const handleToggleFeatured = async (testimonial: Testimonial) => {
    try {
      const shouldFeature = !testimonial.featured;
      if (shouldFeature && featuredTestimonialsCount >= MAX_FEATURED_TESTIMONIALS) {
        setError(
          `Only ${MAX_FEATURED_TESTIMONIALS} testimonials can be featured. Unfeature one before featuring another.`
        );
        return;
      }

      await toggleTestimonialFeatured(testimonial.id, !testimonial.featured);
      await loadTestimonials();
    } catch (err: unknown) {
      console.error("Error toggling featured:", err);
      setError(err instanceof Error ? err.message : "Failed to update featured status");
    }
  };

  // Open edit modal
  const openEditModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setIsEditModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (testimonial: Testimonial) => {
    setTestimonialToDelete(testimonial);
    setIsDeleteDialogOpen(true);
  };

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className="material-symbols-outlined text-base text-amber-400"
            style={{
              fontVariationSettings:
                star <= rating
                  ? "'FILL' 1, 'wght' 760, 'GRAD' 200, 'opsz' 20"
                  : "'FILL' 0, 'wght' 320, 'GRAD' 0, 'opsz' 20",
            }}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  const sortedTestimonials = useMemo(() => {
    const list = [...testimonials];
    list.sort((a, b) => {
      const multiplier = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.key === "rating") {
        return (a.rating - b.rating) * multiplier;
      }
      if (sortConfig.key === "featured") {
        return (Number(a.featured) - Number(b.featured)) * multiplier;
      }
      return a.name.localeCompare(b.name) * multiplier;
    });
    return list;
  }, [sortConfig, testimonials]);

  const featuredTestimonialsCount = useMemo(
    () => testimonials.filter((testimonial) => testimonial.featured).length,
    [testimonials]
  );

  useEffect(() => {
    setSelectedTestimonialIds((current) => current.filter((id) => testimonials.some((testimonial) => testimonial.id === id)));
  }, [testimonials]);

  const toggleSort = (key: "name" | "rating" | "featured") => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedTestimonialIds(checked ? sortedTestimonials.map((testimonial) => testimonial.id) : []);
  };

  const toggleSelectOne = (testimonialId: string, checked: boolean) => {
    setSelectedTestimonialIds((current) => {
      if (checked) {
        return current.includes(testimonialId) ? current : [...current, testimonialId];
      }
      return current.filter((id) => id !== testimonialId);
    });
  };

  const handleBulkUnfeature = async () => {
    try {
      await Promise.all(selectedTestimonialIds.map((id) => toggleTestimonialFeatured(id, false)));
      setSelectedTestimonialIds([]);
      await loadTestimonials();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update selected testimonials");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout
      title="Testimonials"
      description="Manage customer testimonials and reviews"
      adminName={adminName}
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/#testimonials" target="_blank" rel="noopener noreferrer">
              <span className="material-symbols-outlined text-lg">open_in_new</span>
              View on Home
            </Link>
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <span className="material-symbols-outlined mr-2 text-lg">add</span>
            Add Testimonial
          </Button>
        </div>
      }
    >
      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <p className="mb-4 text-sm text-[#6b7280]">
        Homepage featured testimonials:{" "}
        <span className="font-semibold text-[#1a1f2e]">
          {featuredTestimonialsCount}/{MAX_FEATURED_TESTIMONIALS}
        </span>
      </p>

      {/* Testimonials Table */}
      {loading ? (
        <TableSkeleton rowCount={6} colCount={7} />
      ) : testimonials.length === 0 ? (
        <AdminCard className="overflow-hidden p-0">
          <TableEmptyState
            icon="star"
            title="No testimonials yet"
            description="Add customer testimonials to build trust and credibility"
            action={
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                <span className="material-symbols-outlined mr-2 text-lg">add</span>
                Add Testimonial
              </Button>
            }
          />
        </AdminCard>
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <BulkActionBar selectedCount={selectedTestimonialIds.length}>
            <Button variant="secondary" size="sm" onClick={() => setSelectedTestimonialIds([])}>
              Clear
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkUnfeature}>
              Remove Featured
            </Button>
          </BulkActionBar>
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-10">
                    <SelectionCell
                      checked={sortedTestimonials.length > 0 && selectedTestimonialIds.length === sortedTestimonials.length}
                      onChange={toggleSelectAll}
                      label="Select all testimonials"
                    />
                  </Th>
                  <SortableTh
                    resizable
                    active={sortConfig.key === "name"}
                    direction={sortConfig.direction}
                    onToggle={() => toggleSort("name")}
                  >
                    Customer
                  </SortableTh>
                  <Th resizable>Role</Th>
                  <SortableTh
                    resizable
                    active={sortConfig.key === "rating"}
                    direction={sortConfig.direction}
                    onToggle={() => toggleSort("rating")}
                  >
                    Rating
                  </SortableTh>
                  <Th resizable>Review</Th>
                  <SortableTh
                    resizable
                    active={sortConfig.key === "featured"}
                    direction={sortConfig.direction}
                    onToggle={() => toggleSort("featured")}
                  >
                    Featured
                  </SortableTh>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedTestimonials.map((testimonial) => {
                  const isSelected = selectedTestimonialIds.includes(testimonial.id);
                  const cannotFeature = !testimonial.featured && featuredTestimonialsCount >= MAX_FEATURED_TESTIMONIALS;
                  return (
                  <Tr key={testimonial.id} className={isSelected ? "bg-[#fff8ec]" : undefined}>
                    <Td>
                      <SelectionCell
                        checked={isSelected}
                        onChange={(checked) => toggleSelectOne(testimonial.id, checked)}
                        label={`Select testimonial from ${testimonial.name}`}
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        {testimonial.avatar_url ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-full">
                            <Image
                              src={testimonial.avatar_url}
                              alt={testimonial.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b89a5e] text-sm font-bold text-white">
                            {testimonial.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                        )}
                        <span className="font-medium text-[#1a1f2e]">{testimonial.name}</span>
                      </div>
                    </Td>
                    <Td className="text-sm text-[#6b7280]">{testimonial.role || "—"}</Td>
                    <Td>{renderStars(testimonial.rating)}</Td>
                    <Td className="max-w-xs truncate text-sm text-[#6b7280]">
                      {testimonial.content}
                    </Td>
                    <Td>
                      <button
                        onClick={() => handleToggleFeatured(testimonial)}
                        disabled={cannotFeature}
                        title={cannotFeature ? `Maximum of ${MAX_FEATURED_TESTIMONIALS} featured testimonials reached` : "Toggle featured"}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          testimonial.featured
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } ${cannotFeature ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {testimonial.featured ? "Featured" : "Regular"}
                      </button>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(testimonial)}
                          className="rounded-lg p-2 text-[#6b7280] transition hover:bg-[#f3f1ed] hover:text-[#1a1f2e] focus:ring-2 focus:ring-[#b89a5e] focus:ring-offset-2 focus:outline-none"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteDialog(testimonial)}
                          className="rounded-lg p-2 text-[#9ca3af] transition hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
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
        title="Create Testimonial"
        size="md"
      >
        <TestimonialForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isSubmitting}
          currentFeaturedCount={featuredTestimonialsCount}
          maxFeatured={MAX_FEATURED_TESTIMONIALS}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Testimonial"
        size="md"
      >
        {selectedTestimonial && (
          <TestimonialForm
            initialData={selectedTestimonial}
            onSubmit={handleEdit}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={isSubmitting}
            currentFeaturedCount={featuredTestimonialsCount}
            maxFeatured={MAX_FEATURED_TESTIMONIALS}
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from "${testimonialToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
