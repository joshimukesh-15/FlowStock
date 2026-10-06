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
        return (<div role="tablist" className={`flex items-center gap-1 border-b border-slate-200 dark:border-[#22242B] overflow-x-auto no-scrollbar max-w-full touch-pan-x ${className}`}>
        {normalizedTabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const Icon = tab.icon;
                return (<button key={tab.id} role="tab" type="button" aria-selected={isActive} onClick={(e) => { e.preventDefault(); onChange(tab.id); }} className={`relative py-2.5 px-3.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC] rounded-t-sm flex items-center gap-1.5 ${fullWidth ? "flex-1 justify-center" : ""} ${isActive
                        ? "text-[#11120D] dark:text-[#D8CFBC] font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:text-[#9BA3AF] dark:hover:text-slate-200"}`}>
              {Icon && (<Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-[#11120D] dark:text-[#D8CFBC]" : "text-slate-400 dark:text-[#7C8189]"}`}/>)}
              <span>{tab.label}</span>
              {tab.count !== undefined && (<span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium leading-none ${isActive
                            ? "bg-[#D8CFBC] dark:bg-[#D8CFBC] text-[#11120D] dark:text-[#11120D] font-bold"
                            : "bg-slate-100 dark:bg-[#18191E] text-slate-600 dark:text-[#9BA3AF] border border-slate-200 dark:border-[#22242B]"}`}>
                  {tab.count}
                </span>)}

              {/* Sliding underline indicator */}
              {isActive && (<motion.div layoutId={prefersReducedMotion ? undefined : `${layoutId}-underline`} className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#D8CFBC] dark:bg-[#D8CFBC] rounded-full" transition={transitionConfig}/>)}
            </button>);
            })}
      </div>);
    }
    return (<div role="tablist" className={`inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-[#121316] p-1.5 rounded-xl border border-slate-200 dark:border-[#22242B] text-xs shadow-2xs overflow-x-auto no-scrollbar max-w-full touch-pan-x ${className}`}>
      {normalizedTabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (<button key={tab.id} role="tab" type="button" aria-selected={isActive} onClick={(e) => { e.preventDefault(); onChange(tab.id); }} className={`relative rounded-lg font-bold whitespace-nowrap transition-colors z-10 outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC] flex items-center gap-2 cursor-pointer ${fullWidth ? "flex-1 justify-center" : ""} ${size === "md" ? "text-xs py-2 px-3.5" : "text-xs py-1.5 px-3"} ${isActive
                    ? "text-[#11120D] dark:text-[#11120D]"
                    : "text-slate-600 hover:text-slate-900 dark:text-[#808594] dark:hover:text-[#D8CFBC]"}`}>
            {/* Sliding pill indicator */}
            {isActive && (<motion.div layoutId={prefersReducedMotion ? undefined : `${layoutId}-pill`} className="absolute inset-0 bg-[#D8CFBC] dark:bg-[#D8CFBC] rounded-lg shadow-xs border border-[#C5BBA4] dark:border-[#D8CFBC] -z-10" transition={transitionConfig}/>)}

            {Icon && (<Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-[#11120D] dark:text-[#11120D]" : "text-slate-400 dark:text-[#808594]"}`}/>)}
            <span>{tab.label}</span>
            {tab.count !== undefined && (<span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium leading-none ${isActive
                        ? "bg-[#11120D]/10 text-[#11120D] border border-[#11120D]/20 font-bold"
                        : "bg-slate-200/70 dark:bg-[#18191E] text-slate-600 dark:text-[#808594]"}`}>
                {tab.count}
              </span>)}
          </button>);
        })}
    </div>);
}
