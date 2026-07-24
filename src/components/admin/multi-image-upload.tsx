"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";

interface MultiImageUploadProps {
  value?: string[];
  onChange: (files: File[]) => void;
  onRemove?: (imageUrl: string, index: number) => void;
  disabled?: boolean;
  maxImages?: number;
  label?: string;
}

export default function MultiImageUpload({
  value = [],
  onChange,
  onRemove,
  disabled = false,
  maxImages = 10,
  label = "Upload Images",
}: MultiImageUploadProps) {
  const [existingUrls, setExistingUrls] = useState<string[]>(value || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviewUrls, setSelectedPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId().replace(/:/g, "");
  const inputElementId = `gallery-upload-${inputId}`;

  const incomingUrls = value || [];
  const incomingUrlsSignature = JSON.stringify(incomingUrls);

  useEffect(() => {
    setExistingUrls(incomingUrls);
    setSelectedFiles([]);
    setSelectedPreviewUrls([]);
    setError(null);
    onChange([]);
  }, [incomingUrlsSignature, onChange]);

  const previewUrls = useMemo(
    () => [...existingUrls, ...selectedPreviewUrls],
    [existingUrls, selectedPreviewUrls]
  );

  const totalImages = existingUrls.length + selectedFiles.length;

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(String(event.target?.result || ""));
      };
      reader.onerror = () => {
        reject(new Error("Unable to read selected image."));
      };
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    const remainingSlots = maxImages - totalImages;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      e.target.value = "";
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} more image(s) can be added`);
    }

    const validFiles: File[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be less than 5MB");
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    try {
      const previews = await Promise.all(validFiles.map((file) => readFileAsDataUrl(file)));
      const nextFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(nextFiles);
      setSelectedPreviewUrls((current) => [...current, ...previews]);
      onChange(nextFiles);
    } catch (fileReadError) {
      console.error("Error generating image previews:", fileReadError);
      setError("Unable to preview one or more selected images.");
    }

    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const isExistingImage = index < existingUrls.length;

    if (isExistingImage) {
      const removedUrl = existingUrls[index];
      setExistingUrls((current) => current.filter((_, currentIndex) => currentIndex !== index));
      if (onRemove && removedUrl) {
        onRemove(removedUrl, index);
      }
      return;
    }

    const fileIndex = index - existingUrls.length;
    const nextFiles = selectedFiles.filter((_, currentIndex) => currentIndex !== fileIndex);
    const nextPreviews = selectedPreviewUrls.filter((_, currentIndex) => currentIndex !== fileIndex);

    setSelectedFiles(nextFiles);
    setSelectedPreviewUrls(nextPreviews);
    onChange(nextFiles);
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      {totalImages < maxImages && (
        <div>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            multiple
            className="hidden"
            id={inputElementId}
          />
          <label htmlFor={inputElementId}>
            <div className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              disabled
                ? "cursor-not-allowed opacity-50"
                : "border-[#e8e4dc] bg-[#f8f6f2] hover:bg-[#efebe4]"
            }`}>
              <span className="material-symbols-outlined mb-2 text-3xl text-[#6b7280]">
                add_photo_alternate
              </span>
              <p className="mb-1 text-sm font-medium text-[#1a1f2e]">{label}</p>
              <p className="text-xs text-[#6b7280]">
                {totalImages}/{maxImages} images • Max 5MB each
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
          <span className="material-symbols-outlined text-lg text-red-600">error</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Image Grid */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previewUrls.map((url, index) => (
            <div key={index} className="group relative aspect-video overflow-hidden rounded-lg border border-[#e8e4dc]">
              <Image
                src={url}
                alt={`Gallery image ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
              
              {/* Remove Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                  title="Remove image"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}

              {/* Image Number Badge */}
              <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {previewUrls.length === 0 && (
        <p className="text-xs text-[#6b7280]">
          Upload up to {maxImages} images for the property gallery
        </p>
      )}
    </div>
  );
}
