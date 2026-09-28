import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Boxes,
  Truck,
  ReceiptText,
  Building2,
  Plus,
  Zap,
} from "lucide-react";

export function QuickActionsBar({ summary }) {
  const lowStockCount = summary?.inventory?.low_stock_count || 0;
  const inTransitCount = summary?.logistics?.in_transit_count || 0;

  const actions = [
    {
      label: "New Order",
      icon: ShoppingCart,
      href: "/orders",
      color: "hover:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20",
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Stock Movement",
      icon: Boxes,
      href: "/inventory",
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : null,
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      color: "hover:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20",
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Purchase Order",
      icon: Building2,
      href: "/purchasing",
      color: "hover:border-emerald-500/40 hover:bg-[#E2DED2]/30 dark:hover:bg-emerald-950/20",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Shipment Tracking",
      icon: Truck,
      href: "/shipments",
      badge: inTransitCount > 0 ? `${inTransitCount} transit` : null,
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      color: "hover:border-purple-500/40 hover:bg-purple-50/30 dark:hover:bg-purple-950/20",
      accent: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Tax Invoice",
      icon: ReceiptText,
      href: "/invoices",
      color: "hover:border-sky-500/40 hover:bg-[#E2DED2]/30 dark:hover:bg-sky-950/20",
      accent: "text-sky-600 dark:text-[#92AA97]",
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E2DED2]/80 dark:bg-[#1B2A20] border border-[#BDC9B8]/80 dark:border-[#4C6B55] text-[11px] font-semibold uppercase tracking-wider text-[#6D8C73] dark:text-[#9BA3AF] shrink-0">
        <Zap className="w-3.5 h-3.5 text-[#92AA97]" />
        <span>Quick Actions</span>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              to={act.href}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#BDC9B8] dark:border-[#4C6B55] bg-[#F7F3EA] dark:bg-[#1B2A20] text-xs font-medium text-[#314C3B] dark:text-[#E2E8F0] shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all whitespace-nowrap cursor-pointer ${act.color}`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center bg-[#E2DED2] dark:bg-[#314C3B]/50 ${act.accent} group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-3 h-3" />
              </div>
              <span className="font-medium text-[12px]">{act.label}</span>
              {act.badge ? (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full border font-mono font-medium ${act.badgeColor}`}
                >
                  {act.badge}
                </span>
              ) : (
                <Plus className="w-3 h-3 text-[#6D8C73] opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
