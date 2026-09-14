import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatINR(amount) {
    const num = Number(amount) || 0;
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateString, includeTime = false) {
    if (!dateString) return "—";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "—";
        if (includeTime) {
            return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
        }
        return d.toLocaleDateString("en-IN", { dateStyle: "medium" });
    } catch {
        return "—";
    }
}
