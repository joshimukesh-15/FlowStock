"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
const ThemeContext = createContext(undefined);
const THEME_STORAGE_KEY = "flowstock_theme";
function getSystemTheme() {
    if (typeof window === "undefined")
        return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
                return stored;
            }
        }
        return "system";
    });
    const [resolvedTheme, setResolvedTheme] = useState(() => {
        if (theme === "system")
            return getSystemTheme();
        return theme;
    });
    // Apply class to documentElement and update resolvedTheme
    const applyTheme = useCallback((targetTheme) => {
        const root = document.documentElement;
        const resolved = targetTheme === "system" ? getSystemTheme() : targetTheme;
        setResolvedTheme(resolved);
        if (resolved === "dark") {
            root.classList.add("dark");
        }
        else {
            root.classList.remove("dark");
        }
    }, []);
    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);
    // Listen for system theme changes when theme === "system"
    useEffect(() => {
        if (theme !== "system")
            return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            applyTheme("system");
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme, applyTheme]);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        }
        catch {
            // Ignore localStorage write errors
        }
    };
    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };
    return (<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>);
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
