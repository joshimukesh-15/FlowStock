import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatINR(amount, options = {}) {
    const num = Number(amount) || 0;
    const opts = typeof options === "number" ? { decimals: options } : (options || {});

    if (opts.compact) {
        return formatINRCompact(num);
    }

    let decimals = 2;
    if (opts.decimals !== undefined) {
        decimals = opts.decimals;
    } else if (opts.autoDecimals) {
        decimals = Math.abs(num) >= 1000 || num % 1 === 0 ? 0 : 2;
    }

    return "₹" + num.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

export function formatINRCompact(amount) {
    const num = Number(amount) || 0;
    const abs = Math.abs(num);
    const sign = num < 0 ? "-" : "";

    if (abs >= 10000000) {
        const cr = abs / 10000000;
        return `${sign}₹${cr >= 100 ? cr.toFixed(1) : cr.toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
        const lk = abs / 100000;
        return `${sign}₹${lk >= 100 ? lk.toFixed(1) : lk.toFixed(2)} L`;
    }
    if (abs >= 1000) {
        const k = abs / 1000;
        return `${sign}₹${k >= 100 ? k.toFixed(0) : k.toFixed(1)} K`;
    }
    return `${sign}₹${abs.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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

export const selectClass =
    "w-full bg-white dark:bg-[#191B15] border border-slate-300 dark:border-[#33372B] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-[#F4F5F7] focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-200 transition-colors";
