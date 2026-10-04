import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatINR(amount, options = {}) {
    const num = Number(amount) || 0;
    const opts = typeof options === "number" ? { decimals: options } : (options || {});

    // Microsoft Dynamics 365 Smart Scale: Compact for large figures in KPI widgets
    if (opts.compact || (opts.smartScale && Math.abs(num) >= 10000000)) {
        return formatINRCompact(num, opts);
    }

    let decimals = 2;
    if (opts.decimals !== undefined) {
        decimals = opts.decimals;
    } else if (opts.autoDecimals) {
        decimals = Math.abs(num) >= 1000 || num % 1 === 0 ? 0 : 2;
    }

    // Microsoft Dynamics 365 Ledger standard: 3,2,2 grouping (e.g., ₹1,00,00,00,000.00)
    return "₹" + num.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

export function formatINRCompact(amount, options = {}) {
    const num = Number(amount) || 0;
    const abs = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    const showSymbol = options.showSymbol !== false;
    const prefix = showSymbol ? "₹" : "";

    // Microsoft Dynamics 365 Crores (1 Cr = 1,00,00,000 = 10 Million)
    // E.g., 1,000,000,000 -> ₹100.00 Cr
    if (abs >= 10000000) {
        const cr = abs / 10000000;
        const decimals = options.decimals !== undefined ? options.decimals : (cr >= 100 ? 1 : 2);
        const formatted = cr.toLocaleString("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        return `${sign}${prefix}${formatted} Cr`;
    }

    // Microsoft Dynamics 365 Lakhs (1 L = 1,00,000 = 100 Thousand)
    // E.g., 7,599,070 -> ₹75.99 L
    if (abs >= 100000) {
        const lk = abs / 100000;
        const decimals = options.decimals !== undefined ? options.decimals : (lk >= 100 ? 1 : 2);
        const formatted = lk.toLocaleString("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        return `${sign}${prefix}${formatted} L`;
    }

    // Thousands (1 K = 1,000)
    if (abs >= 10000) {
        const k = abs / 1000;
        return `${sign}${prefix}${k.toFixed(1)} K`;
    }

    // Standard Indian number formatting for values under 10k
    return `${sign}${prefix}${abs.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
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
