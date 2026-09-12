"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getTransition, useReducedMotion, DURATION, EASING } from "@/motion";
import { LayoutDashboard, Layers, Boxes, Warehouse, Building2, ShoppingCart, Truck, ReceiptText, History, Settings, PanelLeftClose, Package, } from "lucide-react";
const NAV_GROUPS = [
    {
        label: "Core Workspace",
        items: [
            { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
            { label: "Products & SKUs", icon: Layers, href: "/products" },
            { label: "Inventory Ledger", icon: Boxes, href: "/inventory" },
            { label: "Warehouses & Stock", icon: Warehouse, href: "/warehouses" },
        ],
    },
    {
        label: "Transactions & Supply",
        items: [
            { label: "Orders & Sales", icon: ShoppingCart, href: "/orders" },
            { label: "Suppliers & Purchasing", icon: Building2, href: "/purchasing" },
            { label: "Shipments & Logistics", icon: Truck, href: "/shipments" },
            { label: "Invoices & Accounts", icon: ReceiptText, href: "/invoices" },
        ],
    },
    {
        label: "Administration",
        items: [
            { label: "Audit Trails", icon: History, href: "/audit" },
            { label: "Settings", icon: Settings, href: "/settings" },
        ],
    },
];

export const Sidebar = () => {
    const location = useLocation();
    const pathname = location.pathname;
    const prefersReducedMotion = useReducedMotion();
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === "undefined")
            return false;
        return localStorage.getItem("flowstock_sidebar_collapsed") === "1";
    });
    const [hoveredTooltip, setHoveredTooltip] = useState(null);
    useEffect(() => {
        try {
            localStorage.setItem("flowstock_sidebar_collapsed", collapsed ? "1" : "0");
        }
        catch {
            // Ignore storage write failures
        }
        // Clear any open tooltip on collapse state change
        setHoveredTooltip(null);
    }, [collapsed]);
    // Keyboard shortcut: "[" to toggle sidebar collapse
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Do not trigger if typing inside inputs, textareas, or contentEditable
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target?.isContentEditable) {
                return;
            }
            if (e.key === "[") {
                e.preventDefault();
                setCollapsed((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    const handleMouseEnter = useCallback((e, label, options) => {
        if (!collapsed)
            return;
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredTooltip({
            label,
            top: rect.top + rect.height / 2,
            active: options?.active,
            shortcut: options?.shortcut,
        });
    }, [collapsed]);
    const handleMouseLeave = useCallback(() => {
        setHoveredTooltip(null);
    }, []);
    const isActive = (href) => href === "/" ? pathname === "/" : pathname.startsWith(href) && href !== "#";
    return (<>
      <aside className={`${collapsed ? "w-16" : "w-64"} bg-zinc-950 text-zinc-300 flex flex-col shrink-0 border-r border-zinc-800 select-none transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-20`} aria-label="Primary navigation">
        {/* Brand Header */}
        <div className={`h-12 flex items-center border-b border-zinc-800/80 transition-all ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <button onClick={() => setCollapsed(!collapsed)} onMouseEnter={(e) => handleMouseEnter(e, "Expand sidebar", { shortcut: "[" })} onMouseLeave={handleMouseLeave} className="flex items-center gap-2.5 min-w-0 text-left group/logo outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg p-1" aria-label={collapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}>
            <span className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm shrink-0 group-hover/logo:bg-zinc-100 transition-colors">
              <Package className="w-3.5 h-3.5 text-black" strokeWidth={2.25}/>
            </span>

            <AnimatePresence mode="wait">
              {!collapsed && (<motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{
                duration: prefersReducedMotion ? 0 : DURATION.micro,
                ease: EASING.standard,
            }} className="flex flex-col min-w-0 text-left overflow-hidden whitespace-nowrap">
                  <span className="font-bold text-[13px] text-white tracking-tight leading-none">
                    FlowStock
                  </span>
                  <span className="text-[8px] text-zinc-400 font-semibold uppercase tracking-widest mt-0.5">
                    Enterprise Core
                  </span>
                </motion.span>)}
            </AnimatePresence>
          </button>

          {!collapsed && (<button onClick={() => setCollapsed(true)} className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0" aria-label="Collapse sidebar" title="Collapse sidebar">
              <PanelLeftClose className="w-3.5 h-3.5"/>
            </button>)}
        </div>

        {/* Navigation Groups */}
        <nav onScroll={() => setHoveredTooltip(null)} className="flex-1 py-2.5 px-2 overflow-y-auto no-scrollbar">
          {NAV_GROUPS.map((group) => (<div key={group.label} className="mb-2.5 last:mb-0">
              {collapsed ? (<div className="mx-2 my-1.5 h-px bg-zinc-800/60"/>) : (<p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  {group.label}
                </p>)}

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (<li key={item.label} className="relative">
                      {active && (<motion.span layoutId="active-navigation-item" className="absolute inset-0 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xs" transition={getTransition("normal", prefersReducedMotion)} aria-hidden="true"/>)}
                      <Link to={item.href} onMouseEnter={(e) => handleMouseEnter(e, item.label, { active })} onMouseLeave={handleMouseLeave} aria-current={active ? "page" : undefined} className={`group relative z-10 flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-[transform,opacity,background-color,border-color,color] outline-none focus-visible:ring-2 focus-visible:ring-white ${collapsed ? "justify-center px-0 py-1.5" : "px-3 py-1.5"} ${active
                        ? "text-white"
                        : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"}`}>
                        <Icon className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${active
                        ? "text-white"
                        : "text-zinc-400 group-hover:text-zinc-100"}`}/>
                        <AnimatePresence>
                          {!collapsed && (<motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{
                            duration: prefersReducedMotion ? 0 : DURATION.micro,
                        }} className="truncate overflow-hidden whitespace-nowrap">
                              {item.label}
                            </motion.span>)}
                        </AnimatePresence>
                        {active && !collapsed && (<span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-xs"/>)}
                      </Link>
                    </li>);
            })}
              </ul>
            </div>))}
        </nav>
      </aside>

      {/* Floating Hover Tooltip for Collapsed Sidebar */}
      <AnimatePresence>
        {collapsed && hoveredTooltip && (<motion.div initial={{ opacity: 0, x: -6, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -4, scale: 0.95 }} transition={{
                duration: prefersReducedMotion ? 0 : DURATION.micro,
                ease: EASING.standard,
            }} style={{ top: hoveredTooltip.top }} className="fixed left-[72px] -translate-y-1/2 z-50 pointer-events-none">
            <div className="relative bg-zinc-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-2xl border border-zinc-700 whitespace-nowrap flex items-center gap-2">
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 border-l border-b border-zinc-700 rotate-45"/>
              <span className="relative z-10">{hoveredTooltip.label}</span>
              {hoveredTooltip.shortcut && (<kbd className="relative z-10 text-[10px] bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-400 font-mono">
                  {hoveredTooltip.shortcut}
                </kbd>)}
              {hoveredTooltip.active && (<span className="relative z-10 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"/>)}
            </div>
          </motion.div>)}
      </AnimatePresence>
    </>);
};
