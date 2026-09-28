import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { KpiTrend } from "@/components/ui/KpiTrend";

export function StatCard({
  title,
  value,
  prefix,
  suffix,
  decimals = 0,
  formatINR = false,
  trend,
  badge,
  subText,
  progress,
  icon: Icon,
  className = "",
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-slate-200/90 dark:border-[#33372B] bg-white dark:bg-[#191B15] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-[#565449] transition-colors duration-150 overflow-hidden group",
        className
      )}
    >
      <div>
        {/* Header: Title + Icon / Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-medium text-slate-500 dark:text-[#9BA3AF] truncate group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
            {title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {badge}
            {Icon && (
              <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-[#23261E] border border-slate-200/50 dark:border-[#33372B] flex items-center justify-center text-slate-600 dark:text-[#9BA3AF] group-hover:text-slate-900 dark:group-hover:text-[#D8CFBC] transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* Value + Trend */}
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums font-mono text-slate-900 dark:text-[#F4F5F7]">
            {typeof value === "number" ? (
              <AnimatedCounter
                value={value}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
                formatINR={formatINR}
              />
            ) : (
              <span>
                {prefix}
                {value}
                {suffix}
              </span>
            )}
          </div>

          {trend && (
            <KpiTrend
              changePct={trend.value}
              invertColors={trend.invertColors}
              comparisonText={trend.label}
            />
          )}
        </div>
      </div>

      {/* Subtext */}
      {subText && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#2B2E25] text-xs text-slate-500 dark:text-[#9BA3AF]">
          {subText}
        </div>
      )}

      {/* Micro 2px Progress Bar at bottom edge */}
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-[#23261E] overflow-hidden">
          <div
            className="h-full bg-[#D8CFBC] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default StatCard;
