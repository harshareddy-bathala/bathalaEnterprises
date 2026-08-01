"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onUploadComplete?: (url: string) => void;
  disabled?: boolean;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  preview?: boolean;
  circular?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  onUploadComplete,
  disabled = false,
  label = "Upload Image",
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  maxSizeMB = 5,
  preview = true,
  circular = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = accept.split(",").map((t) => t.trim());
    if (!validTypes.includes(file.type)) {
      return "Invalid file type. Only JPEG, PNG, and WebP images are allowed.";
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    return null;
  };

  const handleFileChange = useCallback(
    (file: File | null) => {
      setError(null);

      if (!file) {
        setPreviewUrl(null);
        onChange(null);
        return;
      }

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview
      if (preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      onChange(file);
    },
    [onChange, preview, maxSizeMB, accept]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Preview or Upload Area */}
      {previewUrl ? (
        <div className="space-y-3">
          <div
            className={`relative overflow-hidden border border-[#e8e4dc] bg-[#faf9f6] shadow-sm ${
              circular
                ? "mx-auto h-32 w-32 rounded-full"
                : "group aspect-video w-full max-w-sm rounded-lg"
            }`}
          >
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              unoptimized
              sizes={circular ? "128px" : "(max-width: 640px) 100vw, 384px"}
              className="object-cover"
            />
          </div>

          {!disabled && (
            <div className={`flex gap-2 ${circular ? "mx-auto max-w-[200px]" : "w-full max-w-sm"}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClick}
                className="flex-1 bg-white"
              >
                <span className="material-symbols-outlined mr-2 text-[18px]" aria-hidden="true">sync</span>
                Change Image
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemove}
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-100"
              >
                <span className="material-symbols-outlined mr-2 text-[18px]" aria-hidden="true">delete</span>
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? "border-[#b89a5e] bg-[#b89a5e]/5"
              : "border-[#e8e4dc] bg-[#f8f6f2] hover:bg-[#efebe4]"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <span className="material-symbols-outlined mb-2 text-4xl text-[#6b7280]" aria-hidden="true">
            cloud_upload
          </span>
          <p className="mb-1 text-sm font-medium text-[#1a1f2e]">{label}</p>
          <p className="text-xs text-[#6b7280]">
            Drag & drop or click to browse
          </p>
          <p className="mt-2 text-xs text-[#9ca3af]">
            Max {maxSizeMB}MB • JPEG, PNG, WebP
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
          <span className="material-symbols-outlined text-lg text-red-600" aria-hidden="true">
            error
          </span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
