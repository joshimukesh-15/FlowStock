"use client";
import { motion } from "framer-motion";
import { DURATION, EASING, useReducedMotion } from "@/motion";
export function Tabs({ tabs, activeTab, onChange, layoutId = "active-tab", variant = "pill", size = "sm", className = "", fullWidth = false, }) {
    const prefersReducedMotion = useReducedMotion();
    const normalizedTabs = tabs.map((tab) => {
        if (typeof tab === "string") {
            return {
                id: tab,
                label: tab.replace(/_/g, " "),
            };
        }
        return tab;
    });
    const transitionConfig = prefersReducedMotion
        ? { duration: 0 }
        : { duration: DURATION.normal, ease: EASING.smooth };
    if (variant === "underline") {
        return (<div role="tablist" className={`flex items-center gap-1 border-b border-slate-200 dark:border-[#33372B] overflow-x-auto no-scrollbar ${className}`}>
        {normalizedTabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const Icon = tab.icon;
                return (<button key={tab.id} role="tab" type="button" aria-selected={isActive} onClick={() => onChange(tab.id)} className={`relative py-2.5 px-3.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-white rounded-t-sm flex items-center gap-1.5 ${fullWidth ? "flex-1 justify-center" : ""} ${isActive
                        ? "text-slate-950 dark:text-[#F4F5F7] font-semibold"
                        : "text-slate-500 hover:text-slate-800 dark:text-[#9BA3AF] dark:hover:text-slate-200"}`}>
              {Icon && (<Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-slate-950 dark:text-[#F4F5F7]" : "text-slate-400 dark:text-[#7C8189]"}`}/>)}
              <span>{tab.label}</span>
              {tab.count !== undefined && (<span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium leading-none ${isActive
                            ? "bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950"
                            : "bg-slate-100 dark:bg-[#23261E] text-slate-600 dark:text-[#9BA3AF] border border-slate-200 dark:border-[#3A404F]"}`}>
                  {tab.count}
                </span>)}

              {/* Sliding underline indicator */}
              {isActive && (<motion.div layoutId={prefersReducedMotion ? undefined : `${layoutId}-underline`} className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-950 dark:bg-slate-100 rounded-full" transition={transitionConfig}/>)}
            </button>);
            })}
      </div>);
    }
    // Variant: "pill" (Segmented Control Slider)
    return (<div role="tablist" className={`inline-flex items-center gap-1 bg-slate-100 dark:bg-[#191B15] p-1 rounded-lg border border-slate-200 dark:border-[#33372B] text-xs overflow-x-auto no-scrollbar ${className}`}>
      {normalizedTabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (<button key={tab.id} role="tab" type="button" aria-selected={isActive} onClick={() => onChange(tab.id)} className={`relative py-1 px-2.5 rounded-md font-medium whitespace-nowrap transition-colors z-10 outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-white flex items-center gap-1.5 ${fullWidth ? "flex-1 justify-center" : ""} ${size === "md" ? "text-xs py-1.5 px-3" : "text-xs py-1 px-2.5"} ${isActive
                    ? "text-slate-950 dark:text-[#F4F5F7] font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:text-[#9BA3AF] dark:hover:text-slate-200"}`}>
            {/* Sliding pill indicator */}
            {isActive && (<motion.div layoutId={prefersReducedMotion ? undefined : `${layoutId}-pill`} className="absolute inset-0 bg-white dark:bg-[#23261E] rounded-md shadow-xs -z-10" transition={transitionConfig}/>)}

            {Icon && (<Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-slate-950 dark:text-[#F4F5F7]" : "text-slate-400 dark:text-[#7C8189]"}`}/>)}
            <span>{tab.label}</span>
            {tab.count !== undefined && (<span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium leading-none ${isActive
                        ? "bg-slate-100 dark:bg-[#191B15] text-slate-900 dark:text-[#F4F5F7] border border-slate-200 dark:border-[#3A404F]"
                        : "bg-slate-200/70 dark:bg-[#23261E] text-slate-600 dark:text-[#9BA3AF]"}`}>
                {tab.count}
              </span>)}
          </button>);
        })}
    </div>);
}
