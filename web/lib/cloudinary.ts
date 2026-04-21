// web/lib/cloudinary.ts

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

// Cloudinary dashboard > Settings > Upload > Upload presets
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "marketplace_unsigned";

/** Unsigned upload endpoint */
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

/** Verilen public_id'den optimize edilmiş görsel URL'i döndürür */
export function getImageUrl(
  publicId: string,
  options?: { width?: number; height?: number; quality?: number },
): string {
  const { width, height, quality = 80 } = options ?? {};
  const transforms = [
    "f_auto",
    `q_${quality}`,
    width ? `w_${width}` : "",
    height ? `h_${height}` : "",
    "c_fill",
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}
