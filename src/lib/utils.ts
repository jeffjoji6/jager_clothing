import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function optimizeCloudinaryUrl(url: string, width: number = 800) {
  if (!url || !url.includes('res.cloudinary.com')) return url;

  // Check if transformations already exist (simple check for now)
  // If we just blindly insert, we need to split at /upload/
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  // f_auto: auto format, q_auto: auto quality
  // w_${width}: resize to width (max)
  // c_limit: resize to fit within limits without upscaling or cropping
  return `${parts[0]}/upload/f_auto,q_auto,w_${width},c_limit/${parts[1]}`;
}
