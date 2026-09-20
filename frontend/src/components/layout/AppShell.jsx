"use client";
import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { ReactLenis } from "@studio-freight/react-lenis";

export const AppShell = ({ children }) => {
    const location = useLocation();
    const lenisRef = useRef(null);

    useEffect(() => {
        if (location.pathname !== "/" && location.pathname !== "/welcome") {
            try {
                sessionStorage.setItem("flowstock_last_route", location.pathname);
            } catch {}
        }
        if (lenisRef.current?.lenis) {
            lenisRef.current.lenis.scrollTo(0, { immediate: true });
        } else if (lenisRef.current?.wrapper) {
            lenisRef.current.wrapper.scrollTo(0, 0);
        }
    }, [location.pathname]);

    return (
      <WebSocketProvider>
        <div className="flex h-screen bg-slate-50 dark:bg-[#14171F] text-slate-950 dark:text-[#F4F5F7] overflow-hidden font-sans">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />
            <ReactLenis
              ref={lenisRef}
              options={{
                lerp: 0.09,
                smoothWheel: true,
                wheelMultiplier: 0.95,
                touchMultiplier: 1.5,
              }}
              className="app-canvas flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 bg-slate-50 dark:bg-[#14171F]"
            >
              {children}
            </ReactLenis>
          </div>
        </div>
      </WebSocketProvider>
    );
};
