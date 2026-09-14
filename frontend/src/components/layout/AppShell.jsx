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
        <div className="flex h-screen bg-slate-50 dark:bg-[#14171F] text-slate-950 dark:text-[#F4F5F7] overflow-hidden font-sans">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />
            <main ref={mainRef} className="app-canvas flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 bg-slate-50 dark:bg-[#14171F]">
              {children}
            </main>
          </div>
        </div>
      </WebSocketProvider>
    );
};
