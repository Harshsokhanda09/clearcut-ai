export const IMAGE_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxDimension: 5000,
  acceptedMimes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
} as const;

export interface ImageValidationError {
  code: string;
  message: string;
}

export async function validateImageFile(file: File): Promise<ImageValidationError | null> {
  if (file.size === 0) return { code: "EMPTY", message: "This file is empty." };
  if (file.size > IMAGE_LIMITS.maxBytes) {
    return {
      code: "TOO_LARGE",
      message: `File is over 10 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB).`,
    };
  }
  if (
    !IMAGE_LIMITS.acceptedMimes.includes(file.type as (typeof IMAGE_LIMITS.acceptedMimes)[number])
  ) {
    return { code: "BAD_TYPE", message: "Only JPG, PNG and WEBP are supported." };
  }
  const dims = await readImageDimensions(file).catch(() => null);
  if (!dims) return { code: "CORRUPTED", message: "This file doesn't look like a valid image." };
  if (dims.width > IMAGE_LIMITS.maxDimension || dims.height > IMAGE_LIMITS.maxDimension) {
    return {
      code: "TOO_LARGE_DIMS",
      message: `Image is larger than 5000 × 5000 px (${dims.width} × ${dims.height}).`,
    };
  }
  return null;
}

export function readImageDimensions(file: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
