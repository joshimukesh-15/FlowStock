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
import { usePermissions } from "@/hooks/usePermissions";

export function QuickActionsBar({ summary }) {
  const { isRouteAllowed } = usePermissions();
  const lowStockCount = summary?.inventory?.low_stock_count || 0;
  const inTransitCount = summary?.logistics?.in_transit_count || 0;

  const actions = [
    {
      label: "New Order",
      icon: ShoppingCart,
      href: "/orders",
      color: "hover:border-[#565449]/40 hover:bg-[#D8CFBC]/20 dark:hover:bg-[#1E2026]",
      accent: "text-[#11120D] dark:text-[#D8CFBC]",
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
      color: "hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20",
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
      color: "hover:border-[#565449]/40 hover:bg-[#D8CFBC]/20 dark:hover:bg-[#1E2026]",
      accent: "text-[#565449] dark:text-[#D8CFBC]",
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100/80 dark:bg-[#191B15] border border-slate-200/80 dark:border-[#33372B] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] shrink-0">
        <Zap className="w-3.5 h-3.5 text-[#D8CFBC]" />
        <span>Quick Actions</span>
      </div>

      <div className="flex items-center gap-2">
        {actions.filter((act) => isRouteAllowed(act.href)).map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              to={act.href}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#33372B] bg-white dark:bg-[#191B15] text-xs font-medium text-slate-800 dark:text-[#E2E8F0] shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all whitespace-nowrap cursor-pointer ${act.color}`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center bg-slate-100 dark:bg-[#23261E]/50 ${act.accent} group-hover:scale-105 transition-transform`}
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
                <Plus className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
