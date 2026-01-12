/**
 * Utility functions for optimizing images from Supabase Storage
 * Uses Supabase's image transformation API to serve properly sized WebP images
 */

const SUPABASE_URL = "https://nqbklvemcxemhgxlnyyq.supabase.co";

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
}

/**
 * Returns the original URL without transformation
 * Image transformation API requires Supabase Pro plan - disabled to avoid 403 errors
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  options: ImageTransformOptions = {}
): string {
  if (!originalUrl) return '/placeholder.svg';
  
  // Return original URL without transformation to avoid 403 errors
  // Supabase image transformation API requires Pro plan
  return originalUrl;
}

/**
 * Get optimized avatar URL based on display size
 */
export function getOptimizedAvatarUrl(
  avatarUrl: string | null | undefined,
  size: 'sm' | 'md' | 'lg' | 'xl' = 'md'
): string {
  const sizeMap = {
    sm: 32,
    md: 80,  // 40px displayed * 2 for retina
    lg: 160, // 80px displayed * 2 for retina
    xl: 256  // 128px displayed * 2 for retina
  };

  return getOptimizedImageUrl(avatarUrl, {
    width: sizeMap[size],
    height: sizeMap[size],
    quality: 80
  });
}

/**
 * Get optimized post image URL
 */
export function getOptimizedPostImageUrl(
  imageUrl: string | null | undefined,
  maxWidth: number = 1200
): string {
  return getOptimizedImageUrl(imageUrl, {
    width: maxWidth,
    quality: 80
  });
}
