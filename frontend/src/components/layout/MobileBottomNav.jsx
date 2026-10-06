"use client";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Layers, ShoppingCart, Boxes, Menu } from "lucide-react";

export const MobileBottomNav = ({ onOpenMenu }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Products", icon: Layers, href: "/products" },
    { label: "Orders", icon: ShoppingCart, href: "/orders" },
    { label: "Ledger", icon: Boxes, href: "/inventory" },
  ];

  const isActive = (href) => {
    return href === "/" ? pathname === "/" : pathname.startsWith(href) && href !== "#";
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-[#22242B] z-40 px-2 flex items-center justify-around select-none"
      aria-label="Mobile quick navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-11 py-1 rounded-xl transition-all active:scale-95 ${
              active
                ? "text-slate-950 dark:text-[#D8CFBC] font-semibold"
                : "text-slate-500 dark:text-[#808594] hover:text-slate-900 dark:hover:text-[#F4F5F7]"
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 shrink-0" />
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-950 dark:bg-[#D8CFBC]" />
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Full Menu Drawer Toggle Button */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 h-11 py-1 rounded-xl text-slate-500 dark:text-[#808594] hover:text-slate-900 dark:hover:text-[#F4F5F7] transition-all active:scale-95 cursor-pointer"
        aria-label="Open full navigation drawer"
      >
        <Menu className="w-5 h-5 shrink-0" />
        <span className="text-[10px] font-medium tracking-tight mt-0.5">
          Menu
        </span>
      </button>
    </nav>
  );
};
