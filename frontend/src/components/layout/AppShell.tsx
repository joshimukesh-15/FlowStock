"use client";

import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { fetchHealth } from "@/lib/api";

interface AppShellProps {
  children: React.ReactNode;
  isHealthy?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, isHealthy: propHealthy }) => {
  const [internalHealthy, setInternalHealthy] = useState(true);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (propHealthy !== undefined) return;
    const check = async () => {
      try {
        const res = await fetchHealth();
        setInternalHealthy(res.status === "healthy" || res.status === "degraded");
      } catch {
        setInternalHealthy(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [propHealthy]);

  const healthy = propHealthy !== undefined ? propHealthy : internalHealthy;

  return (
    <WebSocketProvider>
      <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-100 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header isHealthy={healthy} />
          <main ref={mainRef} className="app-canvas flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50 dark:bg-[#09090b]">
            {children}
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
};
