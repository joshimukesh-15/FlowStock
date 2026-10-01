import { cn } from "@/lib/utils";

export const badgeVariants = {
  default:
    "bg-slate-100 dark:bg-[#1E2026] text-slate-700 dark:text-[#D8CFBC] border-slate-200/80 dark:border-[#2E313C]",
  brand:
    "bg-[#090A0C] text-[#FFFBF4] dark:bg-[#D8CFBC] dark:text-[#090A0C] border-[#090A0C] dark:border-[#D8CFBC]",
  bone:
    "bg-[#D8CFBC]/25 text-[#090A0C] dark:text-[#D8CFBC] border-[#D8CFBC]/50 dark:border-[#D8CFBC]/30",
  success:
    "bg-[#090A0C] text-[#FFFBF4] dark:bg-[#D8CFBC] dark:text-[#090A0C] border-[#090A0C] dark:border-[#D8CFBC]",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  danger:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  info:
    "bg-sky-500/10 text-sky-700 dark:text-[#38BDF8] border-sky-500/30",
};

const dotColors = {
  default: "bg-slate-400 dark:bg-slate-500",
  brand: "bg-[#D8CFBC] dark:bg-[#090A0C]",
  bone: "bg-[#090A0C] dark:bg-[#D8CFBC]",
  success: "bg-[#D8CFBC] dark:bg-[#090A0C]",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
  info: "bg-sky-500 dark:bg-[#38BDF8]",
};

export const Badge = ({ className, variant = "default", showDot = true, children, ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight border transition-colors select-none",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

export default Badge;
