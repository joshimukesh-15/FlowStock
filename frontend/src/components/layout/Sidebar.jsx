"use client";
import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getTransition, useReducedMotion, DURATION, EASING } from "@/motion";
import { LayoutDashboard, Layers, Boxes, Warehouse, Building2, ShoppingCart, Truck, ReceiptText, History, Settings, PanelLeftClose, LogOut, } from "lucide-react";
import { Logomark } from "@/components/ui/Logomark";
import { useAuth } from "@/context/AuthContext";
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
    const navigate = useNavigate();
    const { logout } = useAuth();
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
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } bg-white dark:bg-[#191B15] text-slate-700 dark:text-[#9BA3AF] flex flex-col shrink-0 border-r border-slate-200 dark:border-[#33372B] select-none transition-[width] duration-200 ease-out relative z-20 overflow-hidden`}
        aria-label="Primary navigation"
      >
        {/* Brand Header */}
        <div className="h-12 flex items-center px-2 border-b border-slate-200 dark:border-[#33372B] shrink-0 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            onMouseEnter={(e) => handleMouseEnter(e, "Expand sidebar")}
            onMouseLeave={handleMouseLeave}
            className="flex items-center min-w-0 w-full text-left group/logo outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC] rounded p-0 cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="w-8 h-8 shrink-0 flex items-center justify-center">
              <span className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-0.5">
                <Logomark className="w-5 h-5" />
              </span>
            </span>

            <div
              className={`flex flex-col min-w-0 ml-2 text-left overflow-hidden whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <span className="font-semibold text-xs text-slate-900 dark:text-[#F4F5F7] tracking-tight leading-none">
                FlowStock
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#9BA3AF] mt-0.5 leading-none">
                Operations Ledger
              </span>
            </div>
          </button>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded text-slate-400 dark:text-[#9BA3AF] hover:text-slate-900 dark:hover:text-[#F4F5F7] hover:bg-slate-100 dark:hover:bg-[#23261E] transition-colors shrink-0 ml-auto mr-1 cursor-pointer"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav
          onScroll={() => setHoveredTooltip(null)}
          className="flex-1 py-2.5 px-2 overflow-y-auto no-scrollbar overflow-x-hidden"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3 last:mb-0">
              {collapsed ? (
                <div className="mx-2 my-2 h-px bg-slate-200 dark:bg-[#33372B]" />
              ) : (
                <p className="px-2.5 mb-1 text-[11px] font-medium text-slate-500 dark:text-[#9BA3AF] whitespace-nowrap overflow-hidden">
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
                          className="absolute inset-0 rounded-lg border border-[#D8CFBC]/30 bg-[#D8CFBC]/10 dark:bg-[#D8CFBC]/15"
                          transition={getTransition("normal", prefersReducedMotion)}
                          aria-hidden="true"
                        />
                      )}
                      <Link
                        to={item.href}
                        onMouseEnter={(e) => handleMouseEnter(e, item.label, { active })}
                        onMouseLeave={handleMouseLeave}
                        aria-current={active ? "page" : undefined}
                        className={`group relative z-10 flex items-center h-9 w-full rounded-lg text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC] ${
                          active
                            ? "text-slate-950 dark:text-[#D8CFBC] font-semibold"
                            : "text-slate-600 dark:text-[#9BA3AF] hover:bg-slate-100 dark:hover:bg-[#23261E] hover:text-slate-950 dark:hover:text-[#F4F5F7]"
                        }`}
                      >
                        {/* Fixed Icon slot - exact same 32px center in both collapsed & expanded */}
                        <span className="w-8 h-8 shrink-0 flex items-center justify-center">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              active
                                ? "text-slate-950 dark:text-[#D8CFBC]"
                                : "text-slate-400 dark:text-[#9BA3AF] group-hover:text-slate-700 dark:group-hover:text-slate-200"
                            }`}
                          />
                        </span>

                        <span
                          className={`flex-1 min-w-0 overflow-hidden whitespace-nowrap ml-1 text-left transition-[opacity,transform] duration-200 ${
                            collapsed
                              ? "opacity-0 pointer-events-none -translate-x-1"
                              : "opacity-100 translate-x-0"
                          }`}
                        >
                          <span className="truncate block font-medium">
                            {item.label}
                          </span>
                        </span>

                        {active && !collapsed && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D8CFBC] shrink-0 mr-2" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Sign Out */}
        <div className="p-2 border-t border-slate-200 dark:border-[#33372B] shrink-0 overflow-hidden">
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="h-9 w-full flex items-center rounded-lg text-[13px] font-medium text-slate-500 hover:text-red-600 dark:text-[#9BA3AF] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            title="Sign Out & Return to Landing Page"
          >
            <span className="w-8 h-8 shrink-0 flex items-center justify-center">
              <LogOut className="w-4 h-4 shrink-0" />
            </span>
            <span
              className={`truncate ml-1 text-left transition-[opacity,transform] duration-200 ${
                collapsed
                  ? "opacity-0 pointer-events-none -translate-x-1"
                  : "opacity-100 translate-x-0"
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Floating Hover Tooltip for Collapsed Sidebar */}
      <AnimatePresence>
        {collapsed && hoveredTooltip && (<motion.div initial={{ opacity: 0, x: -6, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -4, scale: 0.95 }} transition={{
                duration: prefersReducedMotion ? 0 : DURATION.micro,
                ease: EASING.standard,
            }} style={{ top: hoveredTooltip.top }} className="fixed left-[72px] -translate-y-1/2 z-50 pointer-events-none">
            <div className="relative bg-[#23261E] text-[#F4F5F7] text-xs font-medium px-2.5 py-1.5 rounded-md shadow-2xl border border-[#33372B] whitespace-nowrap flex items-center gap-2">
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#23261E] border-l border-b border-[#33372B] rotate-45"/>
              <span className="relative z-10">{hoveredTooltip.label}</span>
              {hoveredTooltip.shortcut && (<kbd className="relative z-10 text-[10px] bg-[#11120D] border border-[#33372B] rounded px-1 text-[#9BA3AF] font-mono">
                  {hoveredTooltip.shortcut}
                </kbd>)}
              {hoveredTooltip.active && (<span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#D8CFBC] shrink-0"/>)}
            </div>
          </motion.div>)}
      </AnimatePresence>
    </>);
};
