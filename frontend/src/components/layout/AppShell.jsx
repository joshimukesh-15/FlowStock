"use client";
import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { WebSocketProvider } from "@/context/WebSocketContext";

export const AppShell = ({ children }) => {
    const location = useLocation();
    const mainRef = useRef(null);

    useEffect(() => {
        if (location.pathname !== "/" && location.pathname !== "/welcome") {
            try {
                sessionStorage.setItem("flowstock_last_route", location.pathname);
            } catch {}
        }
        if (mainRef.current) {
            mainRef.current.scrollTo(0, 0);
        }
    }, [location.pathname]);

    return (
      <WebSocketProvider>
        <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-100 overflow-hidden font-sans">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />
            <main ref={mainRef} className="app-canvas flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50 dark:bg-[#09090b]">
              {children}
            </main>
          </div>
        </div>
      </WebSocketProvider>
    );
};
