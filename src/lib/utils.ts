import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with tailwind-merge and clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number into Indonesian Rupiah (IDR) currency format
 * Example: 15000 -> "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats decimal weight numbers cleanly with optional unit ('kg' or 'gram')
 * Example: 2.5, 'kg' -> "2,5 kg" (or "2.5 kg" based on locale)
 */
export function formatWeight(weight: number, unit: 'kg' | 'gram' = 'kg'): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(weight);

  return `${formatted} ${unit}`;
}
