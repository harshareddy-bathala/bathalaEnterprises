"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";
import { getAdminUser } from "@/lib/admin-auth";
import {
  getServicesFromSupabase,
  createService,
  updateService,
  deleteService,
  reorderServices,
} from "@/lib/supabase-queries";
import { Table, TableEmptyState, TableSkeleton, Tbody, Td, Th, Thead, Tr } from "@/components/admin/table";
import AdminLayout, { AdminCard, ErrorAlert, InfoBanner } from "@/components/admin/admin-layout";
import type { Service } from "@/types/tables";
import { getServiceIconFromRecord } from "@/lib/service-format";

const Modal = dynamic(() => import("@/components/modal"), { loading: () => null });
const ServiceForm = dynamic(() => import("@/components/admin/service-form"), { loading: () => null });
const ConfirmDialog = dynamic(() => import("@/components/admin/confirm-dialog"), { loading: () => null });

// Type for service form data
type ServiceFormData = Omit<Service, "id" | "created_at" | "updated_at" | "icon">;

export default function ServicesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Form loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: "title" | "display_order" | "is_featured"; direction: "asc" | "desc" }>({
    key: "display_order",
    direction: "asc",
  });
  const canDragReorder =
    sortConfig.key === "display_order" && sortConfig.direction === "asc";

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

  const loadServices = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getServicesFromSupabase();
      setServices(data);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching services:", err);
      handleAdminError(err, "Failed to load services");
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
      await loadServices(true);

      if (!isMounted || !supabase) {
        return;
      }

      const client = supabase;
      channel = client
        .channel("services-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "services",
          },
          () => {
            void loadServices();
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
  }, [loadServices, router]);

  // Handle create
  const handleCreate = async (data: ServiceFormData) => {
    try {
      setIsSubmitting(true);
      await createService(data);
      await loadServices();
      setIsCreateModalOpen(false);
      setError(null);
    } catch (err: unknown) {
      console.error("Error creating service:", err);
      handleAdminError(err, "Failed to create service");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = async (data: ServiceFormData) => {
    if (!selectedService) return;

    try {
      setIsSubmitting(true);
      await updateService(selectedService.id, data);
      await loadServices();
      setIsEditModalOpen(false);
      setSelectedService(null);
      setError(null);
    } catch (err: unknown) {
      console.error("Error updating service:", err);
      handleAdminError(err, "Failed to update service");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      setIsDeleting(true);
      await deleteService(serviceToDelete.id);
      await loadServices();
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      setError(null);
    } catch (err: unknown) {
      console.error("Error deleting service:", err);
      handleAdminError(err, "Failed to delete service");
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    if (!canDragReorder) {
      return;
    }

    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canDragReorder) {
      return;
    }

    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newServices = [...services];
    const draggedService = newServices[draggedIndex];
    newServices.splice(draggedIndex, 1);
    newServices.splice(index, 0, draggedService);

    setServices(newServices);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (!canDragReorder || draggedIndex === null) return;

    try {
      // Update display_order for all services
      const updates = services.map((service, index) => ({
        id: service.id,
        display_order: index,
      }));

      await reorderServices(updates);
      await loadServices();
      setDraggedIndex(null);
    } catch (err: unknown) {
      console.error("Error reordering services:", err);
      handleAdminError(err, "Failed to reorder services");
      setDraggedIndex(null);
    }
  };

  // Open edit modal
  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setIsEditModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  const sortedServices = useMemo(() => {
    const list = [...services];
    list.sort((a, b) => {
      const multiplier = sortConfig.direction === "asc" ? 1 : -1;

      if (sortConfig.key === "display_order") {
        return ((a.display_order || 0) - (b.display_order || 0)) * multiplier;
      }

      if (sortConfig.key === "is_featured") {
        return (Number(a.is_featured) - Number(b.is_featured)) * multiplier;
      }

      return a.title.localeCompare(b.title) * multiplier;
    });
    return list;
  }, [services, sortConfig]);

  useEffect(() => {
    setSelectedServiceIds((current) => current.filter((id) => services.some((service) => service.id === id)));
  }, [services]);

  useEffect(() => {
    if (!canDragReorder && draggedIndex !== null) {
      setDraggedIndex(null);
    }
  }, [canDragReorder, draggedIndex]);

  // Sort toggle removed as table strictly orders by display_order

  // Bulk actions removed per design specs

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout
      title="Services"
      description="Manage your service offerings"
      adminName={adminName}
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => {
              void loadServices(true);
            }}
            className="w-full sm:w-auto"
            disabled={loading}
          >
            <span className="material-symbols-outlined mr-2 text-lg">refresh</span>
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <span className="material-symbols-outlined mr-2 text-lg">add</span>
            Add Service
          </Button>
        </div>
      }
    >
      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Services Table */}
      {loading ? (
        <TableSkeleton rowCount={6} colCount={7} />
      ) : services.length === 0 ? (
        <AdminCard className="overflow-hidden p-0">
          <TableEmptyState
            icon="design_services"
            title="No services yet"
            description="Create your first service to showcase what you offer"
            action={
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                <span className="material-symbols-outlined mr-2 text-lg">add</span>
                Add Service
              </Button>
            }
          />
        </AdminCard>
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-12">Order</Th>
                  <Th>Title</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedServices.map((service, index) => {
                  return (
                  <Tr
                    key={service.id}
                    onDragOver={canDragReorder ? (e) => handleDragOver(e, index) : undefined}
                  >
                    <Td className="w-12">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                        {canDragReorder && (
                          <div className="flex sm:hidden flex-col gap-1 -mb-1 mt-1">
                            <button
                              type="button"
                              onClick={async () => {
                                if (index > 0) {
                                  const newServices = [...services];
                                  const temp = newServices[index];
                                  newServices[index] = newServices[index - 1];
                                  newServices[index - 1] = temp;
                                  const updates = newServices.map((s, i) => ({ id: s.id, display_order: i }));
                                  await reorderServices(updates);
                                  await loadServices();
                                }
                              }}
                              disabled={index === 0}
                              className="bg-[#f3f1ed] text-[#b89a5e] disabled:opacity-30 rounded p-1 p-0.5"
                            >
                              <span className="material-symbols-outlined text-[16px] block">expand_less</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (index < services.length - 1) {
                                  const newServices = [...services];
                                  const temp = newServices[index];
                                  newServices[index] = newServices[index + 1];
                                  newServices[index + 1] = temp;
                                  const updates = newServices.map((s, i) => ({ id: s.id, display_order: i }));
                                  await reorderServices(updates);
                                  await loadServices();
                                }
                              }}
                              disabled={index === services.length - 1}
                              className="bg-[#f3f1ed] text-[#b89a5e] disabled:opacity-30 rounded p-1 p-0.5"
                            >
                              <span className="material-symbols-outlined text-[16px] block">expand_more</span>
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          draggable={canDragReorder}
                          disabled={!canDragReorder}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            handleDragStart(index);
                          }}
                          onDragEnd={() => {
                            void handleDragEnd();
                          }}
                          className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] transition hover:bg-[#f3f1ed] hover:text-[#6b7280] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Drag to reorder"
                          title="Drag to reorder"
                        >
                          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                        </button>
                        <span className="hidden sm:block font-medium text-[#1a1f2e]">{service.display_order}</span>
                      </div>
                    </Td>
                    <Td className="w-full">
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#f3f1ed]">
                          <span className="material-symbols-outlined text-xl text-[#b89a5e]">
                            {getServiceIconFromRecord(service)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#1a1f2e]">{service.title}</p>
                          {service.is_featured && (
                            <span className="inline-block mt-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] uppercase font-bold text-amber-700">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td className="text-right align-middle">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(service)}
                          className="rounded-lg p-2 text-[#6b7280] transition hover:bg-[#f3f1ed] hover:text-[#1a1f2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89a5e]"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteDialog(service)}
                          className="rounded-lg p-2 text-[#9ca3af] transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
        title="Create Service"
        size="lg"
      >
        <ServiceForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Service"
        size="lg"
      >
        {selectedService && (
          <ServiceForm
            initialData={selectedService}
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
        title="Delete Service"
        message={`Are you sure you want to delete "${serviceToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
