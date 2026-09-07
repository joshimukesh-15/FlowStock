"use client";

import React from "react";
import { motion } from "framer-motion";
import { DURATION, EASING, useReducedMotion } from "@/motion";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number | string;
  icon?: React.ComponentType<{ className?: string }>;
}

export type TabDef<T extends string = string> = TabItem<T> | T;

export interface TabsProps<T extends string = string> {
  tabs: TabDef<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  layoutId?: string;
  variant?: "pill" | "underline";
  size?: "sm" | "md";
  className?: string;
  fullWidth?: boolean;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  layoutId = "active-tab",
  variant = "pill",
  size = "sm",
  className = "",
  fullWidth = false,
}: TabsProps<T>) {
  const prefersReducedMotion = useReducedMotion();

  const normalizedTabs: TabItem<T>[] = tabs.map((tab) => {
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
    return (
      <div
        role="tablist"
        className={`flex items-center gap-1 border-b border-zinc-200 overflow-x-auto no-scrollbar ${className}`}
      >
        {normalizedTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`relative py-2.5 px-3.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 rounded-t-sm flex items-center gap-1.5 ${
                fullWidth ? "flex-1 justify-center" : ""
              } ${
                isActive
                  ? "text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isActive ? "text-zinc-950" : "text-zinc-400"
                  }`}
                />
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium leading-none ${
                    isActive
                      ? "bg-zinc-950 text-white"
                      : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                  }`}
                >
                  {tab.count}
                </span>
              )}

              {/* Sliding underline indicator */}
              {isActive && (
                <motion.div
                  layoutId={prefersReducedMotion ? undefined : `${layoutId}-underline`}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-950 rounded-full"
                  transition={transitionConfig}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: "pill" (Segmented Control Slider)
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs overflow-x-auto no-scrollbar ${className}`}
    >
      {normalizedTabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative py-1 px-2.5 rounded-md font-medium whitespace-nowrap transition-colors z-10 outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 flex items-center gap-1.5 ${
              fullWidth ? "flex-1 justify-center" : ""
            } ${
              size === "md" ? "text-xs py-1.5 px-3" : "text-xs py-1 px-2.5"
            } ${
              isActive
                ? "text-zinc-950 font-semibold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {/* Sliding pill indicator */}
            {isActive && (
              <motion.div
                layoutId={prefersReducedMotion ? undefined : `${layoutId}-pill`}
                className="absolute inset-0 bg-white rounded-md shadow-xs -z-10"
                transition={transitionConfig}
              />
            )}

            {Icon && (
              <Icon
                className={`w-3.5 h-3.5 transition-colors ${
                  isActive ? "text-zinc-950" : "text-zinc-400"
                }`}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium leading-none ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                    : "bg-zinc-200/70 text-zinc-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
