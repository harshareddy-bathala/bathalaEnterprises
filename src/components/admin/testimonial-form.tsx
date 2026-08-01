"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import RatingInput from "./rating-input";
import ImageUpload from "./image-upload";
import type { Testimonial } from "@/types/tables";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600 transition-all duration-200">{message}</p>;
}

const testimonialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  role: z.string().max(100, "Role is too long").optional(),
  content: z.string().min(10, "Content must be at least 10 characters").max(1000, "Content is too long"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  featured: z.boolean().default(false),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

interface TestimonialFormProps {
  initialData?: Partial<Testimonial>;
  onSubmit: (data: TestimonialFormValues, avatarFile: File | null) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  currentFeaturedCount?: number;
  maxFeatured?: number;
}

export default function TestimonialForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  currentFeaturedCount = 0,
  maxFeatured = 3,
}: TestimonialFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: initialData?.name || "",
      role: initialData?.role || "",
      content: initialData?.content || "",
      rating: initialData?.rating || 5,
      featured: initialData?.featured || false,
    },
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const rating = watch("rating");
  const name = watch("name");
  const content = watch("content");
  const isCurrentlyFeatured = Boolean(initialData?.featured);
  const featuredLimitReached = !isCurrentlyFeatured && currentFeaturedCount >= maxFeatured;
  const progressPct = Math.round(([
    name?.trim().length > 1,
    content?.trim().length > 10,
    rating > 0,
  ].filter(Boolean).length / 3) * 100);

  const handleRatingChange = (newRating: number) => {
    setValue("rating", newRating, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: TestimonialFormValues) => {
    await onSubmit(data, avatarFile);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 rounded-[24px] border border-[#ede8df] bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.04)] sm:p-9">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Form Progress</p>
          <p className="text-xs font-medium text-[#7c6442]">{progressPct}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#f2eee6]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#b89a5e] to-[#d5b982] transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <section className="space-y-6 rounded-2xl border border-[#efeae0] bg-[#fcfbf9] p-4 sm:p-5">
      <div className="space-y-2">
        <Label>Avatar (Optional)</Label>
        <ImageUpload
          value={initialData?.avatar_url}
          onChange={setAvatarFile}
          disabled={isLoading}
          label="Upload avatar"
          circular={true}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="relative">
          <Input
            id="name"
            {...register("name")}
            placeholder=" "
            disabled={isLoading}
            className="peer pt-5"
          />
          <Label htmlFor="name" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 bg-[#fcfbf9] px-1 text-sm text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-[#7c6442] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs">
            Name <span className="text-red-500">*</span>
          </Label>
          <FieldError message={errors.name?.message} />
        </div>

        <div className="relative">
          <Input
            id="role"
            {...register("role")}
            placeholder=" "
            disabled={isLoading}
            className="peer pt-5"
          />
          <Label htmlFor="role" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 bg-[#fcfbf9] px-1 text-sm text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-[#7c6442] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs">
            Role / Title (Optional)
          </Label>
          <FieldError message={errors.role?.message} />
        </div>
      </div>

      <div className="relative">
        <Textarea
          id="content"
          {...register("content")}
          placeholder=" "
          rows={4}
          disabled={isLoading}
          className="peer pt-6"
        />
        <Label htmlFor="content" className="pointer-events-none absolute left-4 top-4 bg-[#fcfbf9] px-1 text-sm text-[#8b97a9] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-[#7c6442] peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs">
          Testimonial Content <span className="text-red-500">*</span>
        </Label>
        <FieldError message={errors.content?.message} />
      </div>

      <div className="space-y-2">
        <Label>
          Rating <span className="text-red-500">*</span>
        </Label>
        <RatingInput
          value={rating}
          onChange={handleRatingChange}
          disabled={isLoading}
          size="lg"
        />
        <FieldError message={errors.rating?.message} />
      </div>
      </section>

      <div className="flex items-center gap-3 rounded-lg border border-[#e8e4dc] bg-[#f8f6f2] p-4">
        <input
          type="checkbox"
          id="featured"
          {...register("featured")}
          disabled={isLoading || featuredLimitReached}
          className="h-4 w-4 rounded border-gray-300 text-[#b89a5e] focus:ring-[#b89a5e]"
        />
        <div>
          <Label htmlFor="featured" className="cursor-pointer font-medium">
            Featured Testimonial
          </Label>
          {featuredLimitReached ? (
            <p className="text-xs text-amber-700">
              Featured limit reached ({maxFeatured}/{maxFeatured}). Unfeature one testimonial first.
            </p>
          ) : (
            <p className="text-xs text-[#6b7280]">
              Display this testimonial prominently on the homepage
            </p>
          )}
        </div>
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
          {isLoading ? "Saving..." : initialData?.id ? "Update Testimonial" : "Create Testimonial"}
        </Button>
      </div>
    </form>
  );
}
