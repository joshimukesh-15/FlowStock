"use client";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useReducedMotion } from "@/motion";
export const ThemeToggle = ({ className = "" }) => {
    const { resolvedTheme, toggleTheme } = useTheme();
    const prefersReducedMotion = useReducedMotion();
    const isDark = resolvedTheme === "dark";
    return (
      <motion.button
        type="button"
        onClick={toggleTheme}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#181A20] hover:bg-slate-50 dark:hover:bg-[#23261E] hover:border-slate-300 dark:hover:border-[#565449] text-slate-600 dark:text-[#CBD5E1] hover:text-slate-950 dark:hover:text-white transition-all shadow-2xs hover:shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC] cursor-pointer ${className}`}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={prefersReducedMotion ? false : { rotate: -30, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#D8CFBC] hover:text-white" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 hover:text-slate-950" />
          )}
        </motion.div>
      </motion.button>
    );
};
