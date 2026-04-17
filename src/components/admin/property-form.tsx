"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ImageUpload from "./image-upload";
import MultiImageUpload from "./multi-image-upload";
import type { Property, PropertyType } from "@/types/tables";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600 transition-all duration-200">{message}</p>;
}

const MAX_RELATED_PROPERTIES = 6;
const DRAFT_AUTOSAVE_DELAY_MS = 700;

function parseAmenitiesInput(value?: string): string[] {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

const propertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  location: z.string().min(3, "Location is required").max(200, "Location is too long"),
  price: z.number().min(0, "Price must be positive"),
  type: z.enum(["Rent", "Lease", "Sale"]),
  status: z.enum(["active", "inactive"]).default("active"),
  bedrooms: z.number().min(0, "Bedrooms must be 0 or more").max(50, "Too many bedrooms"),
  sqft: z.number().min(1, "Square footage is required").max(1000000, "Square footage is too large"),
  description: z.string().max(2000, "Description is too long").optional(),
  map_location: z.string().max(500, "Map location is too long").optional(),
  amenities_input: z.string().max(2000, "Amenities text is too long").optional(),
  related_property_ids: z
    .array(z.string().uuid("Invalid related property selected"))
    .max(MAX_RELATED_PROPERTIES, `Select up to ${MAX_RELATED_PROPERTIES} related properties`)
    .default([]),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

export type PropertyFormSubmitData = Omit<
  PropertyFormValues,
  "amenities_input" | "related_property_ids"
> & {
  amenities: string[];
  related_property_ids: string[];
  existing_gallery_images: string[];
  removed_gallery_images: string[];
};

interface RelatedPropertyOption {
  id: string;
  title: string;
  type: PropertyType;
  status: Property["status"];
}

interface PropertyFormProps {
  initialData?: Partial<Property>;
  relatedPropertyOptions?: RelatedPropertyOption[];
  onSubmit: (data: PropertyFormSubmitData, imageFile: File | null, galleryFiles: File[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PropertyForm({
  initialData,
  relatedPropertyOptions = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: initialData?.title || "",
      location: initialData?.location || "",
      price: initialData?.price || 0,
      type: initialData?.type || "Rent",
      status: initialData?.status || "active",
      bedrooms: initialData?.bedrooms || 0,
      sqft: initialData?.sqft || 0,
      description: initialData?.description || "",
      map_location: initialData?.map_location || "",
      amenities_input: initialData?.amenities?.join(", ") || "",
      related_property_ids: (initialData?.related_property_ids || []).filter(Boolean),
    },
  });

  const [draftState, setDraftState] = useState<"idle" | "saved" | "restored">("idle");
  const [draftSavedAtLabel, setDraftSavedAtLabel] = useState<string | null>(null);
  const draftHydratedRef = useRef(false);
  const draftStorageKey = initialData?.id
    ? `bathala:admin:property-form:edit:${initialData.id}`
    : "bathala:admin:property-form:new";
  const watchedDraftValues = watch();

  const validationSummary = useMemo(
    () =>
      Object.entries(errors).flatMap(([fieldName, issue]) => {
        const message = issue?.message;
        if (typeof message !== "string" || message.trim().length === 0) {
          return [];
        }

        return [`${fieldName.replace(/_/g, " ")}: ${message}`];
      }),
    [errors]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      draftHydratedRef.current = true;
      return;
    }

    try {
      const rawDraft = window.localStorage.getItem(draftStorageKey);
      if (!rawDraft) {
        draftHydratedRef.current = true;
        return;
      }

      const parsedDraft = JSON.parse(rawDraft) as {
        savedAt?: number;
        values?: Partial<PropertyFormValues>;
      };

      if (parsedDraft.values && typeof parsedDraft.values === "object") {
        for (const [key, value] of Object.entries(parsedDraft.values)) {
          if (value === undefined) {
            continue;
          }

          setValue(key as keyof PropertyFormValues, value as never, {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
        setDraftState("restored");
      }

      if (typeof parsedDraft.savedAt === "number" && Number.isFinite(parsedDraft.savedAt)) {
        setDraftSavedAtLabel(
          new Date(parsedDraft.savedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    } catch {
      // Ignore malformed drafts and continue with defaults.
    } finally {
      draftHydratedRef.current = true;
    }
  }, [draftStorageKey, setValue]);

  useEffect(() => {
    if (typeof window === "undefined" || isLoading || !draftHydratedRef.current) {
      return;
    }

    const timerId = window.setTimeout(() => {
      const savedAt = Date.now();
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          savedAt,
          values: watchedDraftValues,
        })
      );

      setDraftState((current) => (current === "restored" ? "restored" : "saved"));
      setDraftSavedAtLabel(
        new Date(savedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, DRAFT_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [draftStorageKey, watchedDraftValues, isLoading]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [removedGalleryUrls, setRemovedGalleryUrls] = useState<string[]>([]);

  const location = watch("location");
  const mapLocation = watch("map_location");
  const amenitiesInput = watch("amenities_input");
  const selectedRelatedPropertyIds = watch("related_property_ids");
  const amenitiesPreview = parseAmenitiesInput(amenitiesInput);
  const title = watch("title");
  const price = watch("price");
  const type = watch("type");
  const normalizedMapLocation = (mapLocation || "").trim();
  const normalizedLocation = (location || "").trim();
  const mapQuery = normalizedMapLocation.length > 0 ? normalizedMapLocation : normalizedLocation;
  const formProgress = Math.round(([
    title?.trim().length > 2,
    normalizedLocation.length > 2,
    price > 0,
    type?.length > 0,
    mapQuery.length > 2,
  ].filter(Boolean).length / 5) * 100);
  const mapPreviewUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : "";
  const mapSearchUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : "https://www.google.com/maps";

  const availableRelatedProperties = relatedPropertyOptions.filter(
    (property) => property.id !== initialData?.id
  );

  const handleFormSubmit = async (data: PropertyFormValues) => {
    const amenities = parseAmenitiesInput(data.amenities_input);
    const relatedPropertyIds = Array.from(
      new Set(data.related_property_ids.filter((propertyId) => propertyId !== initialData?.id))
    );
    const remainingExistingGalleryUrls = (initialData?.gallery_images || []).filter(
      (url) => !removedGalleryUrls.includes(url)
    );

    const { amenities_input: _amenitiesInput, related_property_ids: _relatedIds, ...baseData } = data;
    const payload: PropertyFormSubmitData = {
      ...baseData,
      amenities,
      related_property_ids: relatedPropertyIds,
      existing_gallery_images: remainingExistingGalleryUrls,
      removed_gallery_images: removedGalleryUrls,
    };

    await onSubmit(payload, imageFile, galleryFiles);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(draftStorageKey);
    }
    setDraftState("idle");
    setDraftSavedAtLabel(null);
  };

  const handleGalleryRemove = (removedUrl: string) => {
    if (!removedUrl) {
      return;
    }

    setRemovedGalleryUrls((current) =>
      current.includes(removedUrl) ? current : [...current, removedUrl]
    );
  };

  const toggleRelatedProperty = (propertyId: string) => {
    const current = selectedRelatedPropertyIds || [];
    const isSelected = current.includes(propertyId);

    if (isSelected) {
      setValue(
        "related_property_ids",
        current.filter((id) => id !== propertyId),
        { shouldDirty: true, shouldValidate: true }
      );
      return;
    }

    if (current.length >= MAX_RELATED_PROPERTIES) {
      return;
    }

    setValue("related_property_ids", [...current, propertyId], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-6 sm:gap-7">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--admin-text-muted)]">Form Progress</p>
          <p className="text-xs font-bold text-[var(--admin-accent)]">{formProgress}%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--admin-border)]">
          <div className="h-full rounded-full bg-[var(--admin-accent)] transition-all duration-500 ease-out" style={{ width: `${formProgress}%` }} />
        </div>
        {draftState === "restored" ? (
          <p className="text-xs font-medium text-[var(--admin-accent)]">
            Draft restored{draftSavedAtLabel ? ` (saved at ${draftSavedAtLabel})` : ""}.
          </p>
        ) : draftState === "saved" && draftSavedAtLabel ? (
          <p className="text-xs font-medium text-[var(--admin-text-muted)]">Draft autosaved at {draftSavedAtLabel}.</p>
        ) : null}
      </div>

      {validationSummary.length > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2" role="alert" aria-live="polite">
          <p className="text-sm font-semibold text-red-700">Please fix the following:</p>
          <ul className="mt-1 space-y-1 text-xs text-red-700">
            {validationSummary.map((entry) => (
              <li key={entry}>- {entry}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="space-y-6 rounded-2xl border border-[#efeae0] bg-[#fcfbf9] p-4 sm:p-5">
      {/* Main Property Image */}
      <div className="space-y-2">
        <Label>Main Property Image</Label>
        <ImageUpload
          value={initialData?.image_url}
          onChange={setImageFile}
          disabled={isLoading}
          label="Upload main property image"
        />
        <p className="text-xs text-[#6b7280]">
          This will be the primary image shown in listings
        </p>
      </div>

      {/* Gallery Images */}
      <div className="space-y-2">
        <Label>Property Gallery (Optional)</Label>
        <MultiImageUpload
          value={initialData?.gallery_images}
          onChange={setGalleryFiles}
          onRemove={handleGalleryRemove}
          disabled={isLoading}
          label="Add gallery images"
          maxImages={10}
        />
        <p className="text-xs text-[#6b7280]">
          Upload up to 10 additional images for the property gallery
        </p>
      </div>
      </section>

      {/* Title and Location - 2 columns on desktop */}
      <section className="grid gap-5 sm:gap-6 border-t border-[var(--admin-border)] pt-6 sm:grid-cols-2">
        <div className="relative">
          <Input
            id="title"
            {...register("title")}
            placeholder=" "
            disabled={isLoading}
            className="peer pt-5 px-4 h-14 bg-[#faf9f6]"
          />
          <Label htmlFor="title" className="pointer-events-none absolute left-4 top-[14px] -translate-y-1/2 bg-transparent text-sm text-[var(--admin-text-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-[12px] peer-focus:text-[11px] peer-focus:text-[var(--admin-accent)] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">
            Title <span className="text-red-500">*</span>
          </Label>
          <FieldError message={errors.title?.message} />
        </div>

        <div className="relative">
          <Input
            id="location"
            {...register("location")}
            placeholder=" "
            disabled={isLoading}
            className="peer pt-5 px-4 h-14 bg-[#faf9f6]"
          />
          <Label htmlFor="location" className="pointer-events-none absolute left-4 top-[14px] -translate-y-1/2 bg-transparent text-sm text-[var(--admin-text-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-[12px] peer-focus:text-[11px] peer-focus:text-[var(--admin-accent)] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">
            Location <span className="text-red-500">*</span>
          </Label>
          <FieldError message={errors.location?.message} />
        </div>
      </section>

      {/* Type and Status - 2 columns */}
      <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type" className="text-xs font-semibold text-[var(--admin-text)]">
            Type <span className="text-red-500">*</span>
          </Label>
          <select
            id="type"
            {...register("type")}
            disabled={isLoading}
            className="h-14 w-full rounded-xl border border-[var(--admin-border)] bg-[#faf9f6] px-4 text-sm font-medium text-[var(--admin-text)] outline-none transition focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/20"
          >
            <option value="Rent">Rent</option>
            <option value="Lease">Lease</option>
            <option value="Sale">Sale</option>
          </select>
          <FieldError message={errors.type?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-xs font-semibold text-[var(--admin-text)]">Status</Label>
          <select
            id="status"
            {...register("status")}
            disabled={isLoading}
            className="h-14 w-full rounded-xl border border-[var(--admin-border)] bg-[#faf9f6] px-4 text-sm font-medium text-[var(--admin-text)] outline-none transition focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/20"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Price, Bedrooms, Sqft - 3 columns */}
      <div className="grid gap-5 sm:gap-6 grid-cols-2 sm:grid-cols-3">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="price" className="text-xs font-semibold text-[var(--admin-text)]">
            Price (₹) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            {...register("price", { valueAsNumber: true })}
            placeholder="50000"
            disabled={isLoading}
            className="h-14 bg-[#faf9f6] text-lg font-bold"
          />
          <FieldError message={errors.price?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms" className="text-xs font-semibold text-[var(--admin-text)]">
            Beds <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bedrooms"
            type="number"
            {...register("bedrooms", { valueAsNumber: true })}
            placeholder="3"
            disabled={isLoading}
            className="h-14 bg-[#faf9f6] text-base font-semibold"
          />
          <FieldError message={errors.bedrooms?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sqft" className="text-xs font-semibold text-[var(--admin-text)]">
            Sq Ft <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sqft"
            type="number"
            {...register("sqft", { valueAsNumber: true })}
            placeholder="1500"
            disabled={isLoading}
            className="h-14 bg-[#faf9f6] text-base font-semibold"
          />
          <FieldError message={errors.sqft?.message} />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe the property features, amenities, etc."
          rows={4}
          disabled={isLoading}
        />
        <FieldError message={errors.description?.message} />
      </div>

      {/* Map Location */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-[var(--admin-text)]">
            Location for Map <span className="text-[var(--admin-text-muted)]">(Optional)</span>
          </Label>
        </div>
        <div className="relative">
          <Input
            id="map_location"
            {...register("map_location")}
            placeholder=" "
            disabled={isLoading}
            className="peer pt-5 px-4 h-14 bg-[#faf9f6]"
          />
          <Label htmlFor="map_location" className="pointer-events-none absolute left-4 top-[14px] -translate-y-1/2 bg-transparent text-sm text-[var(--admin-text-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-[12px] peer-focus:text-[11px] peer-focus:text-[var(--admin-accent)] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">
            Google Maps Query
          </Label>
        </div>
        <p className="text-xs text-[#6b7280]">
          This address will be used to show the property on Google Maps
        </p>

        <div className="flex flex-wrap gap-2">
          {normalizedLocation && normalizedMapLocation !== normalizedLocation && (
            <button
              type="button"
              onClick={() =>
                setValue("map_location", normalizedLocation, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              className="inline-flex items-center rounded-full border border-[#e8e4dc] bg-[#fafaf9] px-3 py-1 text-xs font-medium text-[#4a5568] transition hover:bg-[#f3f1ed]"
              disabled={isLoading}
            >
              Use listing location
            </button>
          )}

          {mapQuery && (
            <a
              href={mapSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-[#d8c08f] bg-[#fff9ec] px-3 py-1 text-xs font-medium text-[#7c6442] transition hover:bg-[#fef4da]"
            >
              <span className="material-symbols-outlined text-sm">map</span>
              Select on map
            </a>
          )}
        </div>

        <FieldError message={errors.map_location?.message} />

        {/* Live Map Preview */}
        {mapQuery.length > 2 && (
          <div className="mt-3 space-y-2">
            <Label className="text-xs font-medium text-[#6b7280]">Website Map Preview</Label>
            <p className="text-xs text-[#6b7280]">
              This preview uses the same map query shown on the public property detail page.
            </p>
            <div className="overflow-hidden rounded-xl border border-[#e8e4dc]">
              <iframe
                src={mapPreviewUrl}
                width="100%"
                height="200"
                loading="lazy"
                className="border-0"
                title="Property Location Map Preview"
              />
            </div>
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <Label htmlFor="amenities_input">
          Amenities <span className="text-[#6b7280]">(Optional)</span>
        </Label>
        <Textarea
          id="amenities_input"
          {...register("amenities_input")}
          placeholder="Swimming pool, Gym, Power backup (comma-separated or one per line)"
          rows={3}
          disabled={isLoading}
        />
        <p className="text-xs text-[#6b7280]">
          Add highlights that help visitors compare properties quickly.
        </p>
        {amenitiesPreview.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-[#efe9de] bg-[#fffdf8] p-3">
            {amenitiesPreview.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center rounded-full bg-[#f3f1ed] px-2.5 py-1 text-xs font-medium text-[#4a5568]"
              >
                {amenity}
              </span>
            ))}
          </div>
        )}
        {errors.amenities_input && (
          <FieldError message={errors.amenities_input.message} />
        )}
      </div>

      {/* Related Properties */}
      <div className="space-y-3 border-t border-[var(--admin-border)] pt-6">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-[var(--admin-text)]">
            Related Properties <span className="text-[var(--admin-text-muted)]">(Optional)</span>
          </Label>
          <span className="text-xs font-bold text-[var(--admin-text-muted)]">
            {selectedRelatedPropertyIds?.length || 0} / {MAX_RELATED_PROPERTIES}
          </span>
        </div>
        <p className="text-xs text-[var(--admin-text-muted)]">
          Select up to {MAX_RELATED_PROPERTIES} properties to feature at the bottom of this listing's public page.
        </p>

        {availableRelatedProperties.length > 0 ? (
          <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-[#fdfbf9] p-3 shadow-inner">
            {availableRelatedProperties.map((property) => {
              const isSelected = selectedRelatedPropertyIds?.includes(property.id) ?? false;
              const hasReachedLimit =
                !isSelected && (selectedRelatedPropertyIds?.length || 0) >= MAX_RELATED_PROPERTIES;

              return (
                <label
                  key={property.id}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3 transition hover:shadow-sm ${
                    isSelected
                      ? "border-[var(--admin-accent)] bg-white ring-1 ring-[var(--admin-accent)]"
                      : "border-[#ece7de] bg-white hover:border-[#ddd3c1]"
                  } ${hasReachedLimit || isLoading ? "opacity-50 grayscale select-none" : ""}`}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--admin-text)]">{property.title}</p>
                    <div className="flex items-center gap-2">
                       <span className="inline-flex rounded-md bg-[#e8e4db] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text)]">{property.type}</span>
                       <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">{property.status === "active" ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRelatedProperty(property.id)}
                    disabled={isLoading || hasReachedLimit}
                    className="h-4 w-4 min-h-4 min-w-4 max-h-4 max-w-4 flex-shrink-0 cursor-pointer rounded-[4px] border-[#d1d5db] text-[var(--admin-accent)] drop-shadow-sm focus:ring-[var(--admin-accent)]"
                  />
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[#faf9f6] p-6 text-center text-sm font-medium text-[var(--admin-text-muted)]">
            No other properties found yet. Create more listings to configure related properties.
          </div>
        )}
        {errors.related_property_ids && (
          <FieldError message={errors.related_property_ids.message} />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-[#e8e4dc] pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Saving..." : initialData?.id ? "Update Property" : "Create Property"}
        </Button>
      </div>
    </form>
  );
}
