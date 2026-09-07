"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { ToastContainer } from "@/components/ui/ToastContainer";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
  timestamp: string;
  link?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastOptions {
  description?: string;
  type?: ToastType;
  duration?: number;
  link?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (title: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  toast: {
    (title: string, options?: ToastOptions): string;
    success: (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "type" | "description">
    ) => string;
    error: (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "type" | "description">
    ) => string;
    warning: (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "type" | "description">
    ) => string;
    info: (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "type" | "description">
    ) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 5000;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (title: string, options?: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
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
    },
    []
  );

  const toastHelpers = useMemo(() => {
    const fn = (title: string, options?: ToastOptions) => showToast(title, options);

    fn.success = (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "type" | "description">
    ) => showToast(title, { ...options, description, type: "success" });

    fn.error = (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "type" | "description">
    ) => showToast(title, { ...options, description, type: "error" });

    fn.warning = (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "type" | "description">
    ) => showToast(title, { ...options, description, type: "warning" });

    fn.info = (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "type" | "description">
    ) => showToast(title, { ...options, description, type: "info" });

    fn.dismiss = dismissToast;
    fn.dismissAll = dismissAll;

    return fn;
  }, [showToast, dismissToast, dismissAll]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        dismissAll,
        toast: toastHelpers,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
