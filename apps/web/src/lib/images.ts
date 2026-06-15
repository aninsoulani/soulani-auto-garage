/**
 * Resolves a vehicle image URL from the stored path.
 *
 * The database stores local paths like `/uploads/vehicles/abc.jpg`.
 * This helper prepends the API base URL so the browser can fetch the image.
 *
 * In Phase 7, when Cloudinary is enabled, the stored URL will already be
 * an absolute https://res.cloudinary.com/... URL — this function will
 * detect that and return it unchanged (no-op migration).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001';

export function resolveImageUrl(cloudinaryUrl: string | undefined | null): string {
  if (!cloudinaryUrl) return '/placeholder-car.svg';

  // Already an absolute URL (Cloudinary or external) → pass through
  if (cloudinaryUrl.startsWith('http')) return cloudinaryUrl;

  // Local path → prepend API server base URL
  return `${API_BASE}${cloudinaryUrl}`;
}

/**
 * Get the primary image URL from a vehicle's image array.
 * Falls back to the first image, then to a placeholder.
 */
export function getPrimaryImageUrl(
  images: Array<{ fileUrl: string; imageUrl?: string; isPrimary: boolean }> | undefined,
): string {
  if (!images || images.length === 0) return '/placeholder-car.svg';
  const primary = images.find((img) => img.isPrimary) ?? images[0];
  // Prefer the computed imageUrl from the API response
  return primary.imageUrl || resolveImageUrl(primary.fileUrl);
}
