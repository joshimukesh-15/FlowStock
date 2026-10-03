import { cn } from "@/lib/utils";

export const badgeVariants = {
  default:
    "bg-slate-100 dark:bg-[#1E2026] text-slate-700 dark:text-[#D8CFBC] border-slate-200/80 dark:border-[#2E313C]",
  brand:
    "bg-[#D8CFBC] text-[#11120D] border-[#C5BBA4] dark:bg-[#D8CFBC] dark:text-[#11120D] dark:border-[#D8CFBC] font-semibold",
  bone:
    "bg-[#D8CFBC] text-[#11120D] border-[#C5BBA4] dark:bg-[#D8CFBC] dark:text-[#11120D] dark:border-[#D8CFBC] font-semibold",
  success:
    "bg-[#D8CFBC] text-[#11120D] border-[#C5BBA4] dark:bg-[#D8CFBC] dark:text-[#11120D] dark:border-[#D8CFBC] font-semibold",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  danger:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  info:
    "bg-[#D8CFBC]/25 text-[#565449] dark:text-[#D8CFBC] border-[#565449]/25 dark:border-[#D8CFBC]/30",
};

const dotColors = {
  default: "bg-slate-400 dark:bg-slate-500",
  brand: "bg-[#11120D] dark:bg-[#11120D]",
  bone: "bg-[#11120D] dark:bg-[#11120D]",
  success: "bg-[#11120D] dark:bg-[#11120D]",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
  info: "bg-[#565449] dark:bg-[#D8CFBC]",
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
