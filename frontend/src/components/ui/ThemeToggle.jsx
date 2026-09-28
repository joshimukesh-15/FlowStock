"use client";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useReducedMotion } from "@/motion";
export const ThemeToggle = ({ className = "" }) => {
    const { resolvedTheme, toggleTheme } = useTheme();
    const prefersReducedMotion = useReducedMotion();
    const isDark = resolvedTheme === "dark";
    return (<motion.button type="button" onClick={toggleTheme} whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }} className={`relative p-2 rounded-lg text-slate-600 dark:text-[#CBD5E1] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-white ${className}`} aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"} title={isDark ? "Switch to light theme" : "Switch to dark theme"}>
      <motion.div key={isDark ? "sun" : "moon"} initial={prefersReducedMotion ? false : { rotate: -30, opacity: 0, scale: 0.8 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 30, opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
        {isDark ? (<Sun className="w-4 h-4 text-slate-200 hover:text-white"/>) : (<Moon className="w-4 h-4 text-slate-700 hover:text-slate-950"/>)}
      </motion.div>
    </motion.button>);
};
