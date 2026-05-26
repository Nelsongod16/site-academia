import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function formatDistance(km: number, meters = 0) {
  const total = km + meters / 1000;
  return `${total.toFixed(1)} km`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isoNow() {
  return new Date().toISOString();
}
