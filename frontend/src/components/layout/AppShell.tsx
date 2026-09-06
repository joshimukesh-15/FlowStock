"use client";

import React, { useEffect, useState } from "react";
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
      <div className="flex h-screen bg-zinc-50 text-zinc-950 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header isHealthy={healthy} />
          <main className="app-canvas flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50">
            {children}
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
};
