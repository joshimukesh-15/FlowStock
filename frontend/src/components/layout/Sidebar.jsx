"use client";
import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getTransition, useReducedMotion, DURATION, EASING } from "@/motion";
import { LayoutDashboard, Layers, Boxes, Warehouse, Building2, ShoppingCart, Truck, ReceiptText, History, Settings, PanelLeftClose, X } from "lucide-react";
import { Logomark } from "@/components/ui/Logomark";
import { usePermissions } from "@/hooks/usePermissions";

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

export const Sidebar = ({ mobileOpen = false, onCloseMobile }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const prefersReducedMotion = useReducedMotion();
    const { meta, isRouteAllowed } = usePermissions();

    const filteredNavGroups = NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => isRouteAllowed(item.href)),
    })).filter((group) => group.items.length > 0);
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
        className={`hidden md:flex ${
          collapsed ? "w-[52px]" : "w-60"
        } bg-white dark:bg-[#121316] text-slate-700 dark:text-[#A0A5B2] flex flex-col shrink-0 border-r border-slate-200 dark:border-[#22242B] select-none transition-[width] duration-200 ease-out relative z-20 overflow-hidden`}
        aria-label="Primary navigation"
      >
        {/* Brand Header */}
        <div
          className={`h-13 flex items-center border-b border-slate-200 dark:border-[#22242B] shrink-0 overflow-hidden ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            onMouseEnter={(e) => handleMouseEnter(e, "Expand sidebar ( [ )")}
            onMouseLeave={handleMouseLeave}
            className={`flex items-center min-w-0 group/logo outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC] rounded-lg p-0 cursor-pointer ${
              collapsed ? "w-9 h-9 justify-center" : "w-full"
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="w-8 h-8 shrink-0 flex items-center justify-center">
              <span className="w-7 h-7 rounded-lg bg-white dark:bg-[#18191E] border border-slate-200/90 dark:border-[#22242B] shadow-2xs flex items-center justify-center p-0.5 transition-transform duration-150 group-hover/logo:scale-105">
                <Logomark className="w-5 h-5" />
              </span>
            </span>

            <div
              className={`flex flex-col min-w-0 ml-2.5 text-left overflow-hidden whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100 flex-1"
              }`}
            >
              <span className="font-semibold text-xs text-slate-900 dark:text-[#F4F5F7] tracking-tight leading-none">
                FlowStock
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#808594] mt-0.5 leading-none">
                Operations Ledger
              </span>
            </div>
          </button>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md text-slate-400 dark:text-[#808594] hover:text-slate-900 dark:hover:text-[#F4F5F7] hover:bg-slate-100 dark:hover:bg-[#18191E] transition-colors shrink-0 ml-auto cursor-pointer"
              aria-label="Collapse sidebar"
              title="Collapse sidebar ( [ )"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active Role Workspace Strip */}
        {!collapsed && (
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#1E2026] bg-slate-50/60 dark:bg-[#0E1013] flex items-center justify-between shrink-0">
            <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-[#9BA3AF] truncate">
              {meta.badgeLabel}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#7C8189]">
              {meta.shortLabel}
            </span>
          </div>
        )}

        {/* Navigation Groups */}
        <nav
          onScroll={() => setHoveredTooltip(null)}
          className={`flex-1 py-2.5 overflow-y-auto no-scrollbar overflow-x-hidden ${
            collapsed ? "px-1.5" : "px-2"
          }`}
        >
          {filteredNavGroups.map((group, groupIdx) => (
            <div key={group.label} className="mb-2 last:mb-0">
              {collapsed ? (
                groupIdx > 0 && (
                  <div className="w-5 h-px mx-auto my-2 bg-slate-200/80 dark:bg-[#22242B]" />
                )
              ) : (
                <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C8189] whitespace-nowrap overflow-hidden">
                  {group.label}
                </p>
              )}

              <ul className={collapsed ? "space-y-1 flex flex-col items-center" : "space-y-1"}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li
                      key={item.label}
                      className={collapsed ? "relative w-9 h-9" : "relative w-full"}
                    >
                      {active && (
                        <motion.span
                          layoutId="active-navigation-item"
                          className="absolute inset-0 rounded-lg border border-slate-200/90 dark:border-[#2E313D] bg-slate-100 dark:bg-[#1A1C22] shadow-2xs pointer-events-none"
                          transition={getTransition("normal", prefersReducedMotion)}
                          aria-hidden="true"
                        />
                      )}
                      <Link
                        to={item.href}
                        onMouseEnter={(e) => handleMouseEnter(e, item.label, { active })}
                        onMouseLeave={handleMouseLeave}
                        aria-current={active ? "page" : undefined}
                        className={`group relative z-10 flex items-center transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-[#D8CFBC] ${
                          collapsed
                            ? "w-9 h-9 justify-center rounded-lg"
                            : "h-9 w-full px-2.5 rounded-lg text-xs font-medium"
                        } ${
                          active
                            ? "text-slate-950 dark:text-[#F4F5F7] font-semibold"
                            : "text-slate-600 dark:text-[#A0A5B2] hover:bg-slate-100/70 dark:hover:bg-[#18191E] hover:text-slate-950 dark:hover:text-[#F4F5F7]"
                        }`}
                      >
                        {/* Compact icon slot */}
                        <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                              active
                                ? "text-slate-950 dark:text-[#D8CFBC]"
                                : "text-slate-500 dark:text-[#808594] group-hover:text-slate-800 dark:group-hover:text-slate-200"
                            }`}
                          />
                        </span>

                        <span
                          className={`flex-1 min-w-0 overflow-hidden whitespace-nowrap ml-2 text-left transition-[opacity,transform] duration-200 ${
                            collapsed
                              ? "hidden"
                              : "opacity-100 translate-x-0"
                          }`}
                        >
                          <span className="truncate block font-medium">
                            {item.label}
                          </span>
                        </span>

                        {active && !collapsed && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-[#D8CFBC] shrink-0" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Floating Hover Tooltip for Collapsed Sidebar */}
      <AnimatePresence>
        {collapsed && hoveredTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -4, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -3, scale: 0.96 }}
            transition={{
              duration: prefersReducedMotion ? 0 : DURATION.micro,
              ease: EASING.standard,
            }}
            style={{ top: hoveredTooltip.top }}
            className="fixed left-[58px] -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-slate-900/95 dark:bg-[#18191E]/95 backdrop-blur-md text-white dark:text-[#F4F5F7] text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 dark:border-[#2E313D] whitespace-nowrap flex items-center gap-2">
              <span>{hoveredTooltip.label}</span>
              {hoveredTooltip.shortcut && (
                <kbd className="text-[10px] bg-white/10 dark:bg-[#090A0C] border border-white/15 dark:border-[#22242B] rounded px-1.5 py-0.5 text-slate-300 dark:text-[#9BA3AF] font-mono">
                  {hoveredTooltip.shortcut}
                </kbd>
              )}
              {hoveredTooltip.active && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-[#D8CFBC] shrink-0" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Slide-over Drawer & Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#121316] text-slate-700 dark:text-[#A0A5B2] flex flex-col border-r border-slate-200 dark:border-[#22242B] shadow-2xl md:hidden overflow-hidden"
              aria-label="Mobile navigation drawer"
            >
              {/* Drawer Brand Header */}
              <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#22242B] shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#18191E] border border-slate-200/90 dark:border-[#22242B] shadow-2xs flex items-center justify-center p-0.5">
                    <Logomark className="w-5 h-5" />
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs text-slate-900 dark:text-[#F4F5F7] tracking-tight leading-none">
                      FlowStock
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-[#808594] mt-0.5 leading-none">
                      Operations Ledger
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F4F5F7] hover:bg-slate-100 dark:hover:bg-[#18191E] transition-colors cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Mobile Role Workspace Strip */}
              <div className="px-4 py-2 border-b border-slate-100 dark:border-[#1E2026] bg-slate-50/60 dark:bg-[#0E1013] flex items-center justify-between shrink-0">
                <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-[#A0A5B2] truncate">
                  {meta.badgeLabel}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#7C8189]">
                  {meta.shortLabel}
                </span>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-4">
                {filteredNavGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C8189]">
                      {group.label}
                    </p>
                    <ul className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <li key={item.label}>
                            <Link
                              to={item.href}
                              onClick={onCloseMobile}
                              className={`flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-medium transition-all ${
                                active
                                  ? "bg-slate-100 dark:bg-[#1A1C22] text-slate-950 dark:text-[#F4F5F7] font-semibold border border-slate-200/90 dark:border-[#2E313D] shadow-2xs"
                                  : "text-slate-600 dark:text-[#A0A5B2] hover:bg-slate-50 dark:hover:bg-[#18191E] hover:text-slate-950 dark:hover:text-[#F4F5F7]"
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-slate-950 dark:text-[#D8CFBC]" : "text-slate-400 dark:text-[#808594]"}`} />
                              <span className="truncate">{item.label}</span>
                              {active && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-[#D8CFBC]" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>);
};
