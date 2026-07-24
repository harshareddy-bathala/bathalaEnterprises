import { supabase } from "@/lib/supabase-client";
import {
  isTransientNetworkError,
  retryWithExponentialBackoff,
  TimeoutError,
  withTimeout,
} from "@/lib/async-utils";
import { reportError } from "@/lib/monitoring";
import type { Property, Service, Testimonial } from "@/types/tables";

// Re-export types for backward compatibility
export type { Property, Service, Testimonial };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRODUCTION_SETUP_SCRIPT = "SUPABASE_UNIVERSAL_SETUP.sql";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SUPABASE_READ_TIMEOUT_MS = IS_PRODUCTION ? 9_000 : 4_500;
const SUPABASE_WRITE_TIMEOUT_MS = IS_PRODUCTION ? 12_000 : 8_000;
const SUPABASE_READ_RETRIES = IS_PRODUCTION ? 2 : 0;
const SUPABASE_WRITE_RETRIES = IS_PRODUCTION ? 2 : 1;
export const MAX_FEATURED_TESTIMONIALS = 3;

type SupabaseOperationOptions = {
  context: string;
  retries?: number;
  timeoutMs?: number;
  isWrite?: boolean;
};

async function runSupabaseOperation<T = any>(
  operation: () => PromiseLike<T> | T,
  {
    context,
    retries,
    timeoutMs = SUPABASE_READ_TIMEOUT_MS,
    isWrite = false,
  }: SupabaseOperationOptions
): Promise<T> {
  const retryCount =
    typeof retries === "number"
      ? retries
      : isWrite
        ? SUPABASE_WRITE_RETRIES
        : SUPABASE_READ_RETRIES;

  try {
    return await retryWithExponentialBackoff(
      async () =>
        withTimeout(
          Promise.resolve(operation()),
          timeoutMs,
          `Supabase operation timed out: ${context}`
        ),
      {
        retries: retryCount,
        initialDelayMs: 260,
        maxDelayMs: 1_800,
        shouldRetry: (error) => isTransientNetworkError(error),
        onRetry: (error, attempt) => {
          if (IS_PRODUCTION) {
            reportError(error, {
              area: "supabase-queries",
              stage: "retry",
              context,
              attempt,
            });
            return;
          }

          console.warn("Retrying Supabase operation after transient failure", {
            context,
            attempt,
            message: toErrorMessage(error),
          });
        },
      }
    );
  } catch (error) {
    reportError(error, {
      area: "supabase-queries",
      stage: "final_failure",
      context,
    });
    throw error;
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts: string[] = [];
    if (typeof record.message === "string" && record.message.trim()) {
      parts.push(record.message.trim());
    }
    if (typeof record.details === "string" && record.details.trim()) {
      parts.push(record.details.trim());
    }
    if (typeof record.hint === "string" && record.hint.trim()) {
      parts.push(`Hint: ${record.hint.trim()}`);
    }
    if (typeof record.code === "string" && record.code.trim()) {
      parts.push(`Code: ${record.code.trim()}`);
    }

    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  return "Unknown error";
}

function isSchemaNotReadyMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("relation") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  );
}

function isPermissionMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("permission") ||
    normalized.includes("row-level security") ||
    normalized.includes("rls") ||
    normalized.includes("not authorized")
  );
}

function buildMutationError(action: string, entity: string, error: unknown): Error {
  const message = toErrorMessage(error);

  if (isSchemaNotReadyMessage(message)) {
    return new Error(
      `${entity} data is not initialized. Run ${PRODUCTION_SETUP_SCRIPT} and retry.`
    );
  }

  if (isPermissionMessage(message)) {
    return new Error(
      `You do not have permission to ${action} this ${entity}. Ensure your account is in admin_users and active.`
    );
  }

  return new Error(`Failed to ${action} ${entity}: ${message}`);
}

function buildNotFoundOrAccessError(action: string, entity: string): Error {
  return new Error(
    `Could not ${action} ${entity}. It may not exist or you may not have permission.`
  );
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeProperty(property: Property): Property {
  return {
    ...property,
    gallery_images: normalizeStringArray(property.gallery_images),
    amenities: normalizeStringArray(property.amenities),
    related_property_ids: normalizeStringArray(property.related_property_ids),
  };
}

type PropertyWithLegacyFlags = Property & {
  is_active?: boolean | null;
};

function isMissingColumnError(message: string, column: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes(column.toLowerCase()) &&
    (normalized.includes("column") ||
      normalized.includes("schema cache") ||
      normalized.includes("does not exist"))
  );
}

function shouldIncludePropertyInPublicLists(property: PropertyWithLegacyFlags): boolean {
  const statusValue =
    typeof property.status === "string" ? property.status.toLowerCase() : "";

  if (statusValue === "inactive") {
    return false;
  }

  if (statusValue === "active") {
    return true;
  }

  if (typeof property.is_active === "boolean") {
    return property.is_active;
  }

  return true;
}

export async function getPropertiesFromSupabase(
  includeInactive = true
): Promise<Property[]> {
  if (!supabase) {
    console.warn(
      `Supabase client not initialized. Returning empty data. Run ${PRODUCTION_SETUP_SCRIPT} to create tables.`
    );
    return [];
  }

  try {
    const orderedBaseQuery = () =>
      supabase!
        .from("properties")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (includeInactive) {
      const { data, error } = await runSupabaseOperation(
        () => orderedBaseQuery(),
        {
          context: "getPropertiesFromSupabase",
          timeoutMs: SUPABASE_READ_TIMEOUT_MS,
        }
      );

      if (error) {
        const errorMessage = toErrorMessage(error);
        if (isSchemaNotReadyMessage(errorMessage)) {
          console.warn(
            `Properties table not found. Run ${PRODUCTION_SETUP_SCRIPT} to create tables.`,
            errorMessage
          );
        } else {
          console.error("Error fetching properties:", error);
        }
        return [];
      }

      return ((data || []) as Property[]).map(normalizeProperty);
    }

    const { data: activeData, error: activeError } = await runSupabaseOperation(
      () => orderedBaseQuery().eq("status", "active"),
      {
        context: "getPropertiesFromSupabase:active",
        timeoutMs: SUPABASE_READ_TIMEOUT_MS,
      }
    );

    const activeErrorMessage = activeError ? toErrorMessage(activeError) : "";
    if (activeError && !isMissingColumnError(activeErrorMessage, "status")) {
      if (isSchemaNotReadyMessage(activeErrorMessage)) {
        console.warn(
          `Properties table not found. Run ${PRODUCTION_SETUP_SCRIPT} to create tables.`,
          activeErrorMessage
        );
      } else {
        console.error("Error fetching properties:", activeError);
      }
      return [];
    }

    if (!activeError && (activeData?.length ?? 0) > 0) {
      return ((activeData || []) as Property[]).map(normalizeProperty);
    }

    const { data: fallbackData, error: fallbackError } = await runSupabaseOperation(
      () => orderedBaseQuery(),
      {
        context: "getPropertiesFromSupabase:fallback",
        timeoutMs: SUPABASE_READ_TIMEOUT_MS,
      }
    );

    if (fallbackError) {
      console.error("Error fetching fallback property list:", fallbackError);
      return [];
    }

    return ((fallbackData || []) as PropertyWithLegacyFlags[])
      .filter(shouldIncludePropertyInPublicLists)
      .map((property) => normalizeProperty(property as Property));
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message?.includes("Connect Timeout") ||
       error.message?.includes("ECONNREFUSED") ||
       error.message?.includes("timed out"))
    ) {
      console.warn(
        `Database connection timeout. Ensure ${PRODUCTION_SETUP_SCRIPT} has been run and tables exist.`
      );
    } else {
      console.error("Failed to fetch properties:", error);
    }
    return [];
  }
}

export async function getServicesFromSupabase(): Promise<Service[]> {
  if (!supabase) {
    console.warn(
      `Supabase client not initialized. Returning empty data. Run ${PRODUCTION_SETUP_SCRIPT} to create tables.`
    );
    return [];
  }

  try {
    let { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("services")
          .select("*")
          .order("display_order", { ascending: true }),
      {
        context: "getServicesFromSupabase",
        timeoutMs: SUPABASE_READ_TIMEOUT_MS,
      }
    );

    if (error && isMissingColumnError(toErrorMessage(error), "display_order")) {
      const fallbackResult = await runSupabaseOperation(
        () =>
          supabase!
            .from("services")
            .select("*")
            .order("created_at", { ascending: false }),
        {
          context: "getServicesFromSupabase:fallback",
          timeoutMs: SUPABASE_READ_TIMEOUT_MS,
        }
      );

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      const errorMessage = toErrorMessage(error);
      if (
        errorMessage.includes("relations") ||
        errorMessage.includes("does not exist")
      ) {
        console.warn(
          `Services table not found. Run ${PRODUCTION_SETUP_SCRIPT} to create tables.`,
          errorMessage
        );
      } else {
        console.error("Error fetching services:", error);
      }
      return [];
    }

    return ((data || []) as Service[]).filter(
      (service) => service.is_active !== false
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message?.includes("Connect Timeout") ||
       error.message?.includes("ECONNREFUSED") ||
       error.message?.includes("timed out"))
    ) {
      console.warn(
        `Database connection timeout. Ensure ${PRODUCTION_SETUP_SCRIPT} has been run and tables exist.`
      );
    } else {
      console.error("Failed to fetch services:", error);
    }
    return [];
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  if (!supabase) {
    console.warn("Supabase client not initialized");
    return null;
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("services")
          .select("*")
          .eq("id", id)
          .maybeSingle(),
      {
        context: "getServiceById",
        timeoutMs: SUPABASE_READ_TIMEOUT_MS,
      }
    );

    if (error) {
      if (
        error.message.includes("relations") ||
        error.message.includes("does not exist")
      ) {
        console.warn(
          `Services table not found. Run ${PRODUCTION_SETUP_SCRIPT} to create tables.`
        );
      } else {
        console.error("Error fetching service:", error);
      }
      return null;
    }

    return (data as Service | null) ?? null;
  } catch (error) {
    console.error("Failed to fetch service:", error);
    return null;
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  if (!supabase) {
    console.warn("Supabase client not initialized");
    return null;
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("properties")
          .select("*")
          .eq("id", id)
          .single(),
      {
        context: "getPropertyById",
        timeoutMs: SUPABASE_READ_TIMEOUT_MS,
      }
    );

    if (error) {
      if (
        error.message.includes("relations") ||
        error.message.includes("does not exist")
      ) {
        console.warn(
          `Properties table not found. Run ${PRODUCTION_SETUP_SCRIPT} to create tables.`
        );
      } else {
        console.error("Error fetching property:", error);
      }
      return null;
    }

    return normalizeProperty(data as Property);
  } catch (error) {
    console.error("Failed to fetch property:", error);
    return null;
  }
}

export async function getPropertiesByIds(
  ids: string[],
  includeInactive = false
): Promise<Property[]> {
  if (!supabase) {
    console.warn("Supabase client not initialized");
    return [];
  }

  const normalizedIds = Array.from(
    new Set(ids.filter((id) => UUID_PATTERN.test(id)))
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  try {
    let query = supabase.from("properties").select("*").in("id", normalizedIds);

    if (!includeInactive) {
      query = query.eq("status", "active");
    }

    let { data, error } = await runSupabaseOperation(
      () => query,
      {
        context: "getPropertiesByIds",
        timeoutMs: SUPABASE_READ_TIMEOUT_MS,
      }
    );

    if (error && !includeInactive && isMissingColumnError(toErrorMessage(error), "status")) {
      const fallbackResult = await runSupabaseOperation(
        () => supabase!.from("properties").select("*").in("id", normalizedIds),
        {
          context: "getPropertiesByIds:fallback",
          timeoutMs: SUPABASE_READ_TIMEOUT_MS,
        }
      );

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error("Error fetching properties by IDs:", error);
      return [];
    }

    const rows = (data || []) as PropertyWithLegacyFlags[];
    const filteredRows = includeInactive
      ? rows
      : rows.filter(shouldIncludePropertyInPublicLists);

    const normalizedProperties = filteredRows.map((property) =>
      normalizeProperty(property as Property)
    );
    const propertyMap = new Map(
      normalizedProperties.map((property) => [property.id, property])
    );

    return normalizedIds
      .map((id) => propertyMap.get(id))
      .filter((property): property is Property => Boolean(property));
  } catch (error) {
    console.error("Failed to fetch properties by IDs:", error);
    return [];
  }
}

// ============================================================================
// PROPERTIES CRUD
// ============================================================================

export async function createProperty(
  property: Omit<Property, "id" | "created_at" | "updated_at">
): Promise<Property | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("properties")
          .insert(property)
          .select()
          .single(),
      {
        context: "createProperty",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("create", "property", error);
    }

    return normalizeProperty(data as Property);
  } catch (error: unknown) {
    console.error("Error creating property:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("create", "property", error);
  }
}

export async function updateProperty(
  id: string,
  updates: Partial<Omit<Property, "id" | "created_at" | "updated_at">>
): Promise<Property | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("properties")
          .update(updates)
          .eq("id", id)
          .select()
          .maybeSingle(),
      {
        context: "updateProperty",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("update", "property", error);
    }

    if (!data) {
      throw buildNotFoundOrAccessError("update", "property");
    }

    return normalizeProperty(data as Property);
  } catch (error: unknown) {
    console.error("Error updating property:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("update", "property", error);
  }
}

export async function deleteProperty(id: string): Promise<boolean> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("properties")
          .delete()
          .eq("id", id)
          .select("id")
          .maybeSingle(),
      {
        context: "deleteProperty",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("delete", "property", error);
    }

    if (!data) {
      throw buildNotFoundOrAccessError("delete", "property");
    }

    return true;
  } catch (error: unknown) {
    console.error("Error deleting property:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("delete", "property", error);
  }
}

export async function togglePropertyStatus(
  id: string,
  status: "active" | "inactive"
): Promise<Property | null> {
  return updateProperty(id, { status });
}

// ============================================================================
// SERVICES CRUD
// ============================================================================

export async function createService(
  service: Omit<Service, "id" | "created_at" | "updated_at">
): Promise<Service | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    // If no display_order provided, set it to max + 1
    let displayOrder = service.display_order;
    if (displayOrder === undefined || displayOrder === 0) {
      const { data: services } = await runSupabaseOperation(
        () =>
          supabase!
            .from("services")
            .select("display_order")
            .order("display_order", { ascending: false })
            .limit(1),
        {
          context: "createService.fetchDisplayOrder",
          timeoutMs: SUPABASE_READ_TIMEOUT_MS,
        }
      );

      displayOrder = services && services.length > 0 ? services[0].display_order + 1 : 1;
    }

    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("services")
          .insert({ ...service, display_order: displayOrder })
          .select()
          .single(),
      {
        context: "createService",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("create", "service", error);
    }

    return data as Service;
  } catch (error: unknown) {
    console.error("Error creating service:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("create", "service", error);
  }
}

export async function updateService(
  id: string,
  updates: Partial<Omit<Service, "id" | "created_at" | "updated_at">>
): Promise<Service | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("services")
          .update(updates)
          .eq("id", id)
          .select()
          .maybeSingle(),
      {
        context: "updateService",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("update", "service", error);
    }

    if (!data) {
      throw buildNotFoundOrAccessError("update", "service");
    }

    return data as Service;
  } catch (error: unknown) {
    console.error("Error updating service:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("update", "service", error);
  }
}

export async function deleteService(id: string): Promise<boolean> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("services")
          .delete()
          .eq("id", id)
          .select("id")
          .maybeSingle(),
      {
        context: "deleteService",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("delete", "service", error);
    }

    if (!data) {
      throw buildNotFoundOrAccessError("delete", "service");
    }

    return true;
  } catch (error: unknown) {
    console.error("Error deleting service:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("delete", "service", error);
  }
}

export async function reorderServices(
  serviceOrders: Array<{ id: string; display_order: number }>
): Promise<boolean> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    const results = await runSupabaseOperation(
      () =>
        Promise.all(
          serviceOrders.map(({ id, display_order }) =>
            supabase!
              .from("services")
              .update({ display_order })
              .eq("id", id)
              .select("id")
              .maybeSingle()
          )
        ),
      {
        context: "reorderServices",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    for (const result of results) {
      if (result.error) {
        throw buildMutationError("reorder", "service", result.error);
      }
      if (!result.data) {
        throw buildNotFoundOrAccessError("reorder", "service");
      }
    }

    return true;
  } catch (error: unknown) {
    console.error("Error reordering services:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("reorder", "service", error);
  }
}

// ============================================================================
// TESTIMONIALS CRUD
// ============================================================================

async function getFeaturedTestimonialsCount(excludeId?: string): Promise<number> {
  let query = supabase!
    .from("testimonials")
    .select("id", { count: "exact", head: true })
    .eq("featured", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await runSupabaseOperation(
    () => query,
    {
      context: "getFeaturedTestimonialsCount",
      timeoutMs: SUPABASE_READ_TIMEOUT_MS,
    }
  );

  if (error) {
    throw buildMutationError("validate", "testimonial", error);
  }

  return count ?? 0;
}

async function enforceFeaturedTestimonialsLimit(excludeId?: string): Promise<void> {
  const featuredCount = await getFeaturedTestimonialsCount(excludeId);
  if (featuredCount >= MAX_FEATURED_TESTIMONIALS) {
    throw new Error(
      `Only ${MAX_FEATURED_TESTIMONIALS} testimonials can be featured. Unfeature one before featuring another.`
    );
  }
}

export async function getTestimonialsFromSupabase(): Promise<Testimonial[]> {
  if (!supabase) {
    console.warn("Supabase client not initialized");
    return [];
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("testimonials")
          .select("*")
          .order("created_at", { ascending: false }),
      {
        context: "getTestimonialsFromSupabase",
        timeoutMs: SUPABASE_READ_TIMEOUT_MS,
      }
    );

    if (error) {
      console.error("Error fetching testimonials:", error);
      return [];
    }

    return (data || []) as Testimonial[];
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    return [];
  }
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  if (!supabase) {
    console.warn("Supabase client not initialized");
    return [];
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("testimonials")
          .select("*")
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(MAX_FEATURED_TESTIMONIALS),
      {
        context: "getFeaturedTestimonials",
        timeoutMs: SUPABASE_READ_TIMEOUT_MS,
      }
    );

    if (error) {
      console.error("Error fetching featured testimonials:", error);
      return [];
    }

    return (data || []) as Testimonial[];
  } catch (error) {
    console.error("Failed to fetch featured testimonials:", error);
    return [];
  }
}

export async function createTestimonial(
  testimonial: Omit<Testimonial, "id" | "created_at" | "updated_at">
): Promise<Testimonial | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    if (testimonial.featured) {
      await enforceFeaturedTestimonialsLimit();
    }

    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("testimonials")
          .insert(testimonial)
          .select()
          .single(),
      {
        context: "createTestimonial",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("create", "testimonial", error);
    }

    return data as Testimonial;
  } catch (error: unknown) {
    console.error("Error creating testimonial:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("create", "testimonial", error);
  }
}

export async function updateTestimonial(
  id: string,
  updates: Partial<Omit<Testimonial, "id" | "created_at" | "updated_at">>
): Promise<Testimonial | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    if (updates.featured === true) {
      await enforceFeaturedTestimonialsLimit(id);
    }

    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("testimonials")
          .update(updates)
          .eq("id", id)
          .select()
          .maybeSingle(),
      {
        context: "updateTestimonial",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("update", "testimonial", error);
    }

    if (!data) {
      throw buildNotFoundOrAccessError("update", "testimonial");
    }

    return data as Testimonial;
  } catch (error: unknown) {
    console.error("Error updating testimonial:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("update", "testimonial", error);
  }
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  try {
    const { data, error } = await runSupabaseOperation(
      () =>
        supabase!
          .from("testimonials")
          .delete()
          .eq("id", id)
          .select("id")
          .maybeSingle(),
      {
        context: "deleteTestimonial",
        retries: 1,
        timeoutMs: SUPABASE_WRITE_TIMEOUT_MS,
      }
    );

    if (error) {
      throw buildMutationError("delete", "testimonial", error);
    }

    if (!data) {
      throw buildNotFoundOrAccessError("delete", "testimonial");
    }

    return true;
  } catch (error: unknown) {
    console.error("Error deleting testimonial:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw buildMutationError("delete", "testimonial", error);
  }
}

export async function toggleTestimonialFeatured(
  id: string,
  featured: boolean
): Promise<Testimonial | null> {
  return updateTestimonial(id, { featured });
}
