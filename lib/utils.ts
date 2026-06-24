import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDangerColor(level: number): string {
  if (level >= 5) return 'text-red-500'
  if (level >= 4) return 'text-orange-500'
  if (level >= 3) return 'text-amber-500'
  return 'text-emerald-500'
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
