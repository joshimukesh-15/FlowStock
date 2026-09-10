"use client";
import React, { createContext, useContext, useState, useCallback, useMemo, } from "react";
import { ToastContainer } from "@/components/ui/ToastContainer";
const ToastContext = createContext(undefined);
const MAX_TOASTS = 3;
const DEFAULT_DURATION = 5000;
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);
    const showToast = useCallback((title, options) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newToast = {
            id,
            title,
            description: options?.description,
            type: options?.type || "info",
            duration: options?.duration ?? DEFAULT_DURATION,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            link: options?.link,
            action: options?.action,
        };
        setToasts((prev) => {
            // Keep at most MAX_TOASTS (stack up to 3 toasts vertically)
            const updated = [newToast, ...prev];
            return updated.slice(0, MAX_TOASTS);
        });
        return id;
    }, []);
    const toastHelpers = useMemo(() => {
        const fn = (title, options) => showToast(title, options);
        fn.success = (title, description, options) => showToast(title, { ...options, description, type: "success" });
        fn.error = (title, description, options) => showToast(title, { ...options, description, type: "error" });
        fn.warning = (title, description, options) => showToast(title, { ...options, description, type: "warning" });
        fn.info = (title, description, options) => showToast(title, { ...options, description, type: "info" });
        fn.dismiss = dismissToast;
        fn.dismissAll = dismissAll;
        return fn;
    }, [showToast, dismissToast, dismissAll]);
    return (<ToastContext.Provider value={{
            toasts,
            showToast,
            dismissToast,
            dismissAll,
            toast: toastHelpers,
        }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast}/>
    </ToastContext.Provider>);
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
