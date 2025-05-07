import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted string like "1.2 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
