"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import IconPicker from "./icon-picker";
import type { Service } from "@/types/tables";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600 transition-all duration-200">{message}</p>;
}

const DRAFT_AUTOSAVE_DELAY_MS = 700;

const serviceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  card_description: z.string().max(150, "Card description must be 150 characters or less").optional(),
  detailed_description: z.string().max(2000, "Detailed description is too long").optional(),
  icon_name: z.string().min(1, "Please select an icon"),
  price_range: z.string().max(100, "Price range is too long").optional(),
  display_order: z.number().min(0, "Display order must be 0 or more").default(0),
  is_featured: z.boolean().default(false),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  initialData?: Partial<Service>;
  onSubmit: (data: ServiceFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ServiceForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: initialData?.title || "",
      card_description: initialData?.card_description || "",
      detailed_description: initialData?.detailed_description || "",
      icon_name: initialData?.icon_name || "",
      price_range: initialData?.price_range || "",
      display_order: initialData?.display_order || 0,
      is_featured: initialData?.is_featured || false,
    },
  });

  const [draftState, setDraftState] = useState<"idle" | "saved" | "restored">("idle");
  const [draftSavedAtLabel, setDraftSavedAtLabel] = useState<string | null>(null);
  const draftHydratedRef = useRef(false);
  const draftStorageKey = initialData?.id
    ? `bathala:admin:service-form:edit:${initialData.id}`
    : "bathala:admin:service-form:new";
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
        values?: Partial<ServiceFormValues>;
      };

      if (parsedDraft.values && typeof parsedDraft.values === "object") {
        for (const [key, value] of Object.entries(parsedDraft.values)) {
          if (value === undefined) {
            continue;
          }

          setValue(key as keyof ServiceFormValues, value as never, {
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

  const iconName = watch("icon_name");
  const cardDescLength = watch("card_description")?.length || 0;
  const title = watch("title");
  const totalSteps = 4;
  const completedSteps = [title?.trim().length > 1, iconName?.trim().length > 0, cardDescLength > 0, true].filter(Boolean).length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const handleIconChange = (icon: string) => {
    setValue("icon_name", icon, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: ServiceFormValues) => {
    await onSubmit(data);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(draftStorageKey);
    }
    setDraftState("idle");
    setDraftSavedAtLabel(null);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 rounded-[24px] border border-[#ede8df] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.04)] sm:p-9">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Form Progress</p>
          <p className="text-xs font-medium text-[#7c6442]">{progressPct}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#f2eee6]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#b89a5e] to-[#d5b982] transition-all duration-200" style={{ width: `${progressPct}%` }} />
        </div>
        {draftState === "restored" ? (
          <p className="text-xs text-[#7c6442]">
            Draft restored{draftSavedAtLabel ? ` (saved at ${draftSavedAtLabel})` : ""}.
          </p>
        ) : draftState === "saved" && draftSavedAtLabel ? (
          <p className="text-xs text-[#6b7280]">Draft autosaved at {draftSavedAtLabel}.</p>
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
        <div className="relative">
          <Input id="title" {...register("title")} placeholder=" " disabled={isLoading} className="peer pt-5 px-4 h-14 bg-[#faf9f6]" />
          <Label htmlFor="title" className="pointer-events-none absolute left-4 top-[14px] -translate-y-1/2 bg-transparent text-sm text-[var(--admin-text-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-[12px] peer-focus:text-[11px] peer-focus:text-[var(--admin-accent)] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">
            Title <span className="text-red-500">*</span>
          </Label>
          <FieldError message={errors.title?.message} />
        </div>

        <div className="relative">
        <Input
          id="card_description"
          {...register("card_description")}
          placeholder=" "
          maxLength={150}
          disabled={isLoading}
          className="peer pt-5 px-4 h-14 bg-[#faf9f6]"
        />
        <Label htmlFor="card_description" className="pointer-events-none absolute left-4 top-[14px] -translate-y-1/2 bg-transparent text-sm text-[var(--admin-text-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-[12px] peer-focus:text-[11px] peer-focus:text-[var(--admin-accent)] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">
          Card Description
        </Label>
        <div className="flex justify-between">
          <p className="text-xs text-[#6b7280]">
            Displayed on the service card
          </p>
          <p className={`text-xs ${cardDescLength > 140 ? 'text-amber-600' : 'text-[#6b7280]'}`}>
            {cardDescLength}/150
          </p>
        </div>
        <FieldError message={errors.card_description?.message} />
      </div>

        <div className="relative">
        <Textarea
          id="detailed_description"
          {...register("detailed_description")}
          placeholder=" "
          rows={4}
          disabled={isLoading}
          className="peer pt-6 px-4 bg-[#faf9f6]"
        />
        <Label htmlFor="detailed_description" className="pointer-events-none absolute left-4 top-4 bg-transparent text-sm text-[var(--admin-text-muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-[8px] peer-focus:text-[11px] peer-focus:text-[var(--admin-accent)] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[8px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">
          Detailed Description
        </Label>
        <p className="text-xs text-[#6b7280]">
          This will be shown when users click "Learn More"
        </p>
        <FieldError message={errors.detailed_description?.message} />
      </div>
      </section>

      <section className="space-y-6 border-t border-[#ece7de] pt-6">

      <div className="space-y-2">
        <Label>
          Icon <span className="text-red-500">*</span>
        </Label>
        <IconPicker
          value={iconName}
          onChange={handleIconChange}
          disabled={isLoading}
        />
        <FieldError message={errors.icon_name?.message} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="relative">
          <Input
            id="price_range"
            {...register("price_range")}
            placeholder=" "
            disabled={isLoading}
            className="peer pt-5 px-4 h-14 bg-[#faf9f6]"
          />
          <Label htmlFor="price_range" className="pointer-events-none absolute left-4 top-[14px] -translate-y-1/2 bg-transparent text-sm text-[var(--admin-text-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-[12px] peer-focus:text-[11px] peer-focus:text-[var(--admin-accent)] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">Price Range (Optional)</Label>
          <FieldError message={errors.price_range?.message} />
        </div>

        <div className="relative">
          <Input
            id="display_order"
            type="number"
            {...register("display_order", { valueAsNumber: true })}
            placeholder=" "
            disabled={isLoading}
            className="peer pt-5 px-4 h-14 bg-[#faf9f6]"
          />
          <Label htmlFor="display_order" className="pointer-events-none absolute left-4 top-[14px] -translate-y-1/2 bg-transparent text-sm text-[var(--admin-text-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-[12px] peer-focus:text-[11px] peer-focus:text-[var(--admin-accent)] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">Display Order</Label>
          <p className="text-xs text-[#6b7280]">
            Lower numbers appear first
          </p>
          <FieldError message={errors.display_order?.message} />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-[#e8e4dc] bg-[#fafaf9] p-4">
        <input
          type="checkbox"
          id="is_featured"
          {...register("is_featured")}
          disabled={isLoading}
          className="h-4 w-4 rounded border-[#e8e4dc] text-[#b89a5e] focus:ring-[#b89a5e]"
        />
        <div>
          <Label htmlFor="is_featured" className="cursor-pointer">Featured Service</Label>
          <p className="text-xs text-[#6b7280]">
            Featured services are highlighted on the homepage
          </p>
        </div>
      </div>
      </section>

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
          {isLoading ? "Saving..." : initialData?.id ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
}
