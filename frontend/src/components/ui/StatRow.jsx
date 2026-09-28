"use client";
import { cn } from "@/lib/utils";
export function StatRow({ items, children, columns = 4, className = "", }) {
    const colClassMap = {
        2: "sm:grid-cols-2",
        3: "sm:grid-cols-3",
        4: "sm:grid-cols-2 lg:grid-cols-4",
        5: "sm:grid-cols-3 lg:grid-cols-5",
        6: "sm:grid-cols-3 lg:grid-cols-6",
    };
    return (<div className={cn("rounded-lg border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#191B15] shadow-none overflow-hidden", className)}>
      <div className={cn("grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-[#2B2E25]", colClassMap[columns])}>
        {items
            ? items.map((item, idx) => (<StatCol key={item.id || idx} label={item.label} value={item.value} subtext={item.subtext} badge={item.badge} icon={item.icon} progress={item.progress}/>))
            : children}
      </div>
    </div>);
}
export function StatCol({ label, value, subtext, badge, icon: Icon, progress, className = "", onClick, }) {
    return (<div onClick={onClick} className={cn("p-3.5 sm:p-4 flex flex-col justify-between transition-colors", onClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50", className)}>
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-[#7C8189] shrink-0"/>}
            <span className="text-[12px] font-medium text-slate-500 dark:text-[#9BA3AF] truncate">
              {label}
            </span>
          </div>
          {badge}
        </div>

        <div className="mt-1.5 text-lg sm:text-xl font-semibold tracking-tight tabular-nums font-mono text-slate-950 dark:text-[#F4F5F7]">
          {value}
        </div>
      </div>

      {subtext && (<div className="mt-1.5 text-[11px] text-slate-500 dark:text-[#9BA3AF] truncate">
          {subtext}
        </div>)}

      {progress !== undefined && (<div className="mt-2 w-full bg-slate-100 dark:bg-[#23261E] h-1 rounded-full overflow-hidden">
          <div className="h-full bg-slate-900 dark:bg-slate-100 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}/>
        </div>)}
    </div>);
}
