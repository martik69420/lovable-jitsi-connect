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
 * Transforms a Supabase Storage URL to use the image transformation API
 * This serves properly sized and optimized images
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  options: ImageTransformOptions = {}
): string {
  if (!originalUrl) return '/placeholder.svg';
  
  // Only transform Supabase storage URLs
  if (!originalUrl.includes(SUPABASE_URL) || !originalUrl.includes('/storage/v1/object/public/')) {
    return originalUrl;
  }

  const { width, height, quality = 75, format = 'webp' } = options;

  // Extract the bucket and path from the URL
  // Original: https://xxx.supabase.co/storage/v1/object/public/bucket/path
  // Transform to: https://xxx.supabase.co/storage/v1/render/image/public/bucket/path?width=X&format=webp
  const transformedUrl = originalUrl.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  if (width) params.set('width', width.toString());
  if (height) params.set('height', height.toString());
  params.set('quality', quality.toString());
  if (format !== 'origin') params.set('format', format);

  const separator = transformedUrl.includes('?') ? '&' : '?';
  return `${transformedUrl}${separator}${params.toString()}`;
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
