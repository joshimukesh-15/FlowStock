"use client";

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { getTransition, useReducedMotion } from "@/motion";
import {
  LayoutDashboard,
  Layers,
  Boxes,
  Warehouse,
  Building2,
  ShoppingCart,
  Truck,
  ReceiptText,
  History,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Package,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useRealtime } from "@/context/WebSocketContext";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Overview", icon: LayoutDashboard, href: "/" }],
  },
  {
    label: "Operations",
    items: [
      { label: "Products & SKUs", icon: Layers, href: "/products" },
      { label: "Inventory Ledger", icon: Boxes, href: "/inventory" },
      { label: "Warehouses & Stock", icon: Warehouse, href: "/warehouses" },
    ],
  },
  {
    label: "Procurement",
    items: [{ label: "Suppliers & Purchasing", icon: Building2, href: "/purchasing" }],
  },
  {
    label: "Fulfillment",
    items: [
      { label: "Orders & Sales", icon: ShoppingCart, href: "/orders" },
      { label: "Shipments & Logistics", icon: Truck, href: "/shipments" },
    ],
  },
  {
    label: "Financials",
    items: [{ label: "Invoices & Accounts", icon: ReceiptText, href: "/invoices" }],
  },
  {
    label: "Administration",
    items: [
      { label: "Audit Trails", icon: History, href: "/audit" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

const initialsOf = (name?: string) =>
  (name || "FS")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const prefersReducedMotion = useReducedMotion();
  const { currentOrg, currentUser } = useTenant();
  const { isConnected } = useRealtime();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("flowstock_sidebar_collapsed") === "1";
  });

  useEffect(() => {
    try {
      localStorage.setItem("flowstock_sidebar_collapsed", collapsed ? "1" : "0");
    } catch {
      // Ignore storage write failures
    }
  }, [collapsed]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) && href !== "#";

  return (
    <aside
      className={`${
        collapsed ? "w-[68px]" : "w-64"
      } bg-zinc-950 text-zinc-300 flex flex-col shrink-0 border-r border-zinc-800 select-none transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}
      aria-label="Primary navigation"
    >
      {/* Brand Header — logo itself toggles the sidebar */}
      <div
        className={`h-16 flex items-center gap-3 border-b border-zinc-800/80 ${
          collapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 min-w-0 text-left group/logo"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar — click logo to open" : "Collapse sidebar — click logo to collapse"}
        >
          <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0 group-hover/logo:bg-zinc-100 transition-colors">
            <Package className="w-4 h-4 text-black" strokeWidth={2.25} />
          </span>
          {!collapsed && (
            <span className="flex flex-col min-w-0 text-left">
              <span className="font-bold text-sm text-white tracking-tight leading-none">
                FlowStock
              </span>
              <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-widest mt-0.5">
                Enterprise Core
              </span>
            </span>
          )}
        </button>

        {!collapsed && (
          <>
            <Link
              to="/"
              className="sr-only"
              aria-label="Go to overview"
              tabIndex={-1}
            >
              Overview
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            {collapsed ? (
              <div className="mx-3 mb-2 h-px bg-zinc-800/80" />
            ) : (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {group.label}
              </p>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.label} className="relative">
                    {active && (
                      <motion.span
                        layoutId="active-navigation-item"
                        className="absolute inset-0 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xs"
                        transition={getTransition("normal", prefersReducedMotion)}
                        aria-hidden="true"
                      />
                    )}
                    <Link
                      to={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`group relative z-10 flex items-center gap-3 rounded-lg text-[13px] font-medium transition-[transform,opacity,background-color,border-color,color] ${
                        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                      } ${
                        active
                          ? "text-white"
                          : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                          active ? "text-white" : "text-zinc-400 group-hover:text-zinc-100"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {active && !collapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Workspace Footer: Tenant, Operator & System State */}
      <div className="p-3 border-t border-zinc-800/80 space-y-2.5 shrink-0">
        {/* Active tenant / operator card */}
        <Link
          to="/settings"
          title={collapsed ? "Workspace settings" : undefined}
          className={`flex items-center gap-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 p-2.5 transition-colors hover:bg-zinc-900 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-700/80 border border-zinc-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
            {initialsOf(currentUser?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.name || "Operator"}
              </p>
              <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                {currentUser?.role?.replace("_", " ") || "viewer"} ·{" "}
                {currentOrg?.name || "Tenant"}
              </p>
            </div>
          )}
        </Link>

        {/* Version & live stream */}
        <div className="flex items-center justify-between gap-2 px-1">
          {!collapsed && (
            <span className="text-[10px] text-zinc-500 font-medium">
              FlowStock <span className="font-mono">v1.1.0</span>
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
              isConnected ? "text-zinc-300" : "text-zinc-500"
            }`}
            title={isConnected ? "Real-time stream active" : "Reconnecting..."}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-emerald-400" : "bg-zinc-500"
              }`}
            />
            {!collapsed && <span>{isConnected ? "Live" : "Offline"}</span>}
          </span>
        </div>
      </div>
    </aside>
  );
};