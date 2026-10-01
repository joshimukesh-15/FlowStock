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
        className={`relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200/80 dark:border-[#262833] bg-slate-100/70 dark:bg-[#16171C] hover:bg-slate-100 dark:hover:bg-[#1E2026] text-slate-600 dark:text-[#9BA3AF] hover:text-slate-950 dark:hover:text-white transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-[#D8CFBC] cursor-pointer ${className}`}
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
