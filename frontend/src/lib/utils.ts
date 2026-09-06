import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const pageTitleClass = "text-2xl font-bold text-zinc-950 tracking-tight font-sans";
export const pageSubtitleClass = "text-sm text-zinc-500 mt-1";
export const pageHeaderClass = "flex flex-col md:flex-row md:items-center md:justify-between gap-4";
