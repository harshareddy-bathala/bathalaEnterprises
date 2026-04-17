import { supabase } from "./supabase-client";

// Magic bytes for image validation
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/jpg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP)
};

/**
 * Validate image file by checking magic bytes
 */
async function validateImageMagicBytes(file: File): Promise<boolean> {
  const signatures = IMAGE_SIGNATURES[file.type];
  if (!signatures) return false;

  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return signatures.some((signature) =>
    signature.every((byte, index) => bytes[index] === byte)
  );
}

/**
 * Generate cryptographically secure random string
 */
function generateSecureFilename(extension: string): string {
  const timestamp = Date.now();
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(array);
  }
  const randomString = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload an image to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param folder Optional folder path within the bucket
 * @returns The public URL of the uploaded image, or null on failure
 */
async function uploadImage(
  file: File,
  bucket: string | string[],
  folder?: string
): Promise<string | null> {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return null;
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size exceeds 5MB limit");
  }

  // Validate magic bytes to prevent file type spoofing
  const isValidImage = await validateImageMagicBytes(file);
  if (!isValidImage) {
    throw new Error(
      "Invalid image file. The file content does not match the expected image format."
    );
  }

  try {
    // Generate secure filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = generateSecureFilename(fileExt);
    const filePath = folder ? `${folder}/${filename}` : filename;

    const targetBuckets = Array.isArray(bucket) ? bucket : [bucket];
    let lastError = "";

    for (const currentBucket of targetBuckets) {
      const { data, error } = await supabase.storage
        .from(currentBucket)
        .upload(filePath, file, {
          cacheControl: "public, max-age=31536000, immutable",
          upsert: false,
        });

      if (error) {
        lastError = error.message;
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(currentBucket).getPublicUrl(data.path);

      return publicUrl;
    }

    throw new Error(`Upload failed: ${lastError || "no writable storage bucket found"}`);
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param url The public URL of the image to delete
 * @param bucket The storage bucket name
 * @returns True if deletion was successful
 */
async function deleteImage(url: string, bucket: string | string[]): Promise<boolean> {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return false;
  }

  try {
    const targetBuckets = Array.isArray(bucket) ? bucket : [bucket];

    // Extract file path from URL
    const urlObj = new URL(url);
    let extractedPath: string | null = null;
    let matchedBucket: string | null = null;

    for (const currentBucket of targetBuckets) {
      const marker = `/storage/v1/object/public/${currentBucket}/`;
      const markerIndex = urlObj.pathname.indexOf(marker);
      if (markerIndex !== -1) {
        extractedPath = urlObj.pathname.slice(markerIndex + marker.length);
        matchedBucket = currentBucket;
        break;
      }
    }

    if (!matchedBucket || !extractedPath) {
      return false;
    }

    const filePath = decodeURIComponent(extractedPath);
    const { error } = await supabase.storage.from(matchedBucket).remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      throw new Error(`Delete failed: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

/**
 * Upload a property image to the 'properties' bucket
 * @param file The image file to upload
 * @param propertyId Optional property ID for organizing images
 * @returns The public URL of the uploaded image
 */
export async function uploadPropertyImage(
  file: File,
  propertyId?: string
): Promise<string | null> {
  const folder = propertyId || "general";
  return uploadImage(file, ["property-images", "properties"], folder);
}

/**
 * Upload multiple property images to the 'properties' bucket
 * @param files Array of image files to upload
 * @param propertyId Optional property ID for organizing images
 * @returns Array of public URLs for uploaded images (null for failed uploads)
 */
export async function uploadPropertyImages(
  files: File[],
  propertyId?: string
): Promise<(string | null)[]> {
  const uploadPromises = files.map((file) => uploadPropertyImage(file, propertyId));
  return Promise.all(uploadPromises);
}

/**
 * Upload a service icon to the 'services' bucket
 * @param file The image file to upload
 * @param serviceId Optional service ID for organizing images
 * @returns The public URL of the uploaded image
 */
export async function uploadServiceIcon(
  file: File,
  serviceId?: string
): Promise<string | null> {
  const folder = serviceId || "general";
  return uploadImage(file, ["service-icons", "services"], folder);
}

/**
 * Upload a testimonial avatar to the 'testimonials' bucket
 * @param file The image file to upload
 * @param testimonialId Optional testimonial ID for organizing images
 * @returns The public URL of the uploaded image
 */
export async function uploadTestimonialAvatar(
  file: File,
  testimonialId?: string
): Promise<string | null> {
  const folder = testimonialId || "general";
  return uploadImage(file, ["testimonial-avatars", "testimonials"], folder);
}

/**
 * Delete a property image
 * @param url The public URL of the image to delete
 * @returns True if deletion was successful
 */
export async function deletePropertyImage(url: string): Promise<boolean> {
  return deleteImage(url, ["property-images", "properties"]);
}

/**
 * Delete multiple property images
 * @param urls Array of public URLs to delete
 * @returns Array of boolean results (true for successful deletions)
 */
export async function deletePropertyImages(urls: string[]): Promise<boolean[]> {
  const deletePromises = urls.map((url) => deletePropertyImage(url));
  return Promise.all(deletePromises);
}

/**
 * Delete a service icon
 * @param url The public URL of the image to delete
 * @returns True if deletion was successful
 */
export async function deleteServiceIcon(url: string): Promise<boolean> {
  return deleteImage(url, ["service-icons", "services"]);
}

/**
 * Delete a testimonial avatar
 * @param url The public URL of the image to delete
 * @returns True if deletion was successful
 */
export async function deleteTestimonialAvatar(url: string): Promise<boolean> {
  return deleteImage(url, ["testimonial-avatars", "testimonials"]);
}
