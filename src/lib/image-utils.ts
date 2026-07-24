/**
 * Image utilities for optimized loading and blur placeholders
 */

// Base64 encoded blur placeholder SVGs
export const BLUR_DATA_URL = {
  // Neutral gray placeholder (matches brand background)
  default: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWNlN2RlIi8+PC9zdmc+",
  
  // Slightly darker for property cards
  property: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZThlNGRjIi8+PHJlY3QgeD0iMjUlIiB5PSIzMCUiIHdpZHRoPSI1MCUiIGhlaWdodD0iNDAlIiByeD0iOCIgZmlsbD0iI2Q4ZDJjNiIvPjwvc3ZnPg==",
  
  // Avatar/profile placeholder
  avatar: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWNlN2RlIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI0MCIgcj0iMjAiIGZpbGw9IiNkOGQyYzYiLz48ZWxsaXBzZSBjeD0iNTAiIGN5PSI5MCIgcng9IjMwIiByeT0iMjAiIGZpbGw9IiNkOGQyYzYiLz48L3N2Zz4=",
  
  // Hero section placeholder with gradient
  hero: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZjhmNmYyIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZWNlN2RlIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==",
} as const;

// Fallback images for different contexts
export const FALLBACK_IMAGES = {
  property: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23ece7de'/%3E%3Cpath d='M340 280h120v140H340z' fill='%23d8d2c6'/%3E%3Cpath d='M280 420h240L400 200z' fill='%23d8d2c6'/%3E%3Ccircle cx='500' cy='200' r='40' fill='%23d8d2c6'/%3E%3Ctext x='50%25' y='85%25' fill='%23a0998c' font-family='Arial' font-size='24' text-anchor='middle'%3EProperty Image%3C/text%3E%3C/svg%3E",
  
  service: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23ece7de'/%3E%3Crect x='140' y='100' width='120' height='100' rx='8' fill='%23d8d2c6'/%3E%3Ctext x='50%25' y='85%25' fill='%23a0998c' font-family='Arial' font-size='16' text-anchor='middle'%3EService%3C/text%3E%3C/svg%3E",
  
  testimonial: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ece7de'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23d8d2c6'/%3E%3Cellipse cx='50' cy='85' rx='30' ry='18' fill='%23d8d2c6'/%3E%3C/svg%3E",
  
  avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ece7de'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23b89a5e' fill-opacity='0.3'/%3E%3Cellipse cx='50' cy='85' rx='30' ry='18' fill='%23b89a5e' fill-opacity='0.3'/%3E%3C/svg%3E",
} as const;

/**
 * Generate responsive sizes string for common layouts
 */
export function getImageSizes(layout: 'full' | 'half' | 'third' | 'card' | 'thumbnail' | 'avatar'): string {
  switch (layout) {
    case 'full':
      return '100vw';
    case 'half':
      return '(max-width: 768px) 100vw, 50vw';
    case 'third':
      return '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw';
    case 'card':
      return '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px';
    case 'thumbnail':
      return '(max-width: 480px) 50vw, (max-width: 768px) 33vw, 200px';
    case 'avatar':
      return '(max-width: 480px) 64px, 80px';
    default:
      return '100vw';
  }
}

/**
 * Get appropriate blur placeholder based on image type
 */
export function getBlurDataURL(type: keyof typeof BLUR_DATA_URL = 'default'): string {
  return BLUR_DATA_URL[type] || BLUR_DATA_URL.default;
}

/**
 * Get fallback image based on content type
 */
export function getFallbackImage(type: keyof typeof FALLBACK_IMAGES = 'property'): string {
  return FALLBACK_IMAGES[type] || FALLBACK_IMAGES.property;
}

/**
 * Determine if an image should be loaded with priority based on position
 */
export function shouldPrioritize(index: number, visibleCount: number = 2): boolean {
  return index < visibleCount;
}

/**
 * Get loading strategy based on image position
 */
export function getLoadingStrategy(index: number, priorityCount: number = 2): {
  loading: 'eager' | 'lazy';
  priority: boolean;
  fetchPriority: 'high' | 'low' | 'auto';
} {
  const isPriority = index < priorityCount;
  return {
    loading: isPriority ? 'eager' : 'lazy',
    priority: isPriority,
    fetchPriority: isPriority ? 'high' : 'low',
  };
}
