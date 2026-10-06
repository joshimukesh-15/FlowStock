"use client";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { WebSocketProvider } from "@/context/WebSocketContext";

export const AppShell = ({ children }) => {
    const location = useLocation();
    const scrollRef = useRef(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        setMobileNavOpen(false);
        if (location.pathname !== "/" && location.pathname !== "/welcome") {
            try {
                sessionStorage.setItem("flowstock_last_route", location.pathname);
            } catch {
                // Storage quota exceeded or disabled in private browsing
            }
        }
        if (scrollRef.current) {
            scrollRef.current.scrollTo(0, 0);
        }
    }, [location.pathname]);

    return (
      <WebSocketProvider>
        <div className="flex h-screen bg-[#FFFBF4] dark:bg-[#090A0C] text-[#11120D] dark:text-[#F4F5F7] overflow-hidden font-sans">
          <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
            <main
              ref={scrollRef}
              className="app-canvas flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 pb-20 md:pb-6 bg-[#FFFBF4] dark:bg-[#090A0C]"
            >
              {children}
            </main>
          </div>
          <MobileBottomNav onOpenMenu={() => setMobileNavOpen(true)} />
        </div>
      </WebSocketProvider>
    );
};
