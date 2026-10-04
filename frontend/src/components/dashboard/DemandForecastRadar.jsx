"use client";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { autoDraftPOApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Layers,
  Loader2,
} from "lucide-react";

export function DemandForecastRadar({
  forecast,
  className = "",
}) {
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [draftingId, setDraftingId] = useState(null);
  const [draftSuccess, setDraftSuccess] = useState(null);
  const [draftError, setDraftError] = useState(null);

  const items = forecast?.items || [];

  const filteredItems = useMemo(() => {
    if (filterRisk === "ALL") return items;
    return items.filter((item) => item.stockout_risk === filterRisk);
  }, [items, filterRisk]);

  const handleAutoDraft = async (item) => {
    setDraftingId(item.product_id);
    setDraftError(null);
    setDraftSuccess(null);
    try {
      const res = await autoDraftPOApi({
        productId: item.product_id,
        quantity: item.suggested_reorder_qty,
        supplierId: item.primary_supplier_id,
      });
      setDraftSuccess({
        poNumber: res.po_number,
        productName: res.product_name,
        quantity: res.quantity,
        supplierName: res.supplier_name,
        totalCost: res.total_cost,
      });
    } catch (err) {
      setDraftError(err.message || "Failed to auto-draft purchase order");
    } finally {
      setDraftingId(null);
    }
  };

  const getRiskBadge = (risk, days) => {
    switch (risk) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Critical ({days ? `${days}d` : "Depleted"})
          </span>
        );
      case "WARNING":
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Warning ({days ? `${days}d` : "Low"})
          </span>
        );
      case "HEALTHY":
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#D8CFBC]/25 text-[#434035] dark:text-[#D8CFBC] border border-[#C5BBA4] dark:border-[#D8CFBC]/30"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#565449] dark:bg-[#D8CFBC]" />
            Optimal ({days ? `${days}d` : "Safe"})
          </span>
        );
      case "OVERSTOCKED":
      default:
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#565449]/15 text-[#565449] dark:text-[#CBD5E1] border border-[#565449]/30"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#565449]" />
            Overstocked ({days ? `${days}d` : "Surplus"})
          </span>
        );
    }
  };

  const getRunwayBarStyle = (risk) => {
    switch (risk) {
      case "CRITICAL":  return { background: "#ef4444" };
      case "WARNING":   return { background: "#f59e0b" };
      case "HEALTHY":   return { background: "#D8CFBC" }; // Bone neutral
      default:          return { background: "#565449" }; // Olive Drab for overstocked
    }
  };

  // kept for className compat — actual color now in getRunwayBarStyle
  const getRunwayBarColor = () => "";

  return (
    <Card spotlight className={`flex flex-col border border-slate-200 dark:border-[#22242B] bg-white dark:bg-[#11120D] ${className}`}>
      {/* Card Header with Telemetry Stats */}
      <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-[#1E211A] flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] flex items-center gap-2">
              <span className="p-1 rounded bg-[#D8CFBC]/25 text-[#565449] dark:text-[#D8CFBC] border border-[#D8CFBC]/40">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <span>Demand Forecasting & Smart Replenishment</span>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
              Algorithmic stockout runway, daily burn velocity, and 1-click supplier replenishment
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Link to="/purchasing">
              <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5">
                <span>Purchasing</span>
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 4-KPI Bento Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Critical — rose */}
          <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500 block truncate">
              Critical Risk (&lt;7d)
            </span>
            <span className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400 truncate block">
              {forecast?.critical_count ?? 0} <span className="text-xs font-normal text-slate-400">SKUs</span>
            </span>
          </div>

          {/* Warnings — amber-gold */}
          <div
            className="p-2.5 rounded-lg border min-w-0"
            style={{ borderColor: "rgba(217,151,6,0.30)", background: "rgba(217,151,6,0.07)" }}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider block truncate" style={{ color: "#d97706" }}>
              Warnings (7-14d)
            </span>
            <span className="text-lg font-bold tabular-nums truncate block" style={{ color: "#b45309" }}>
              {forecast?.warning_count ?? 0} <span className="text-xs font-normal text-slate-400">SKUs</span>
            </span>
          </div>

          {/* Avg Runway — Olive Drab earthy neutral */}
          <div
            className="p-2.5 rounded-lg border min-w-0"
            style={{ borderColor: "rgba(86,84,73,0.35)", background: "rgba(86,84,73,0.08)" }}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider block truncate" style={{ color: "#D8CFBC" }}>
              Avg Inventory Runway
            </span>
            <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-[#FFFBF4] truncate block">
              {forecast?.avg_days_of_inventory ?? 0} <span className="text-xs font-normal text-slate-400">Days</span>
            </span>
          </div>

          {/* Replenishment Cost — Olive Drab earthy neutral */}
          <div
            className="p-2.5 rounded-lg border min-w-0"
            style={{ borderColor: "rgba(86,84,73,0.35)", background: "rgba(86,84,73,0.08)" }}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider block truncate" style={{ color: "#D8CFBC" }}>
              Replenishment Cost
            </span>
            <span
              className="text-lg font-bold tabular-nums text-slate-900 dark:text-[#FFFBF4] truncate block"
              title={formatINR(forecast?.total_reorder_capital_required ?? 0)}
            >
              {formatINR(forecast?.total_reorder_capital_required ?? 0, { autoDecimals: true })}
            </span>
          </div>
        </div>

        {/* Filter Chip Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
          {[
            { id: "ALL", label: `All SKUs (${items.length})` },
            { id: "CRITICAL", label: `Critical (${forecast?.critical_count ?? 0})` },
            { id: "WARNING", label: `Warnings (${forecast?.warning_count ?? 0})` },
            { id: "HEALTHY", label: `Optimal (${forecast?.healthy_count ?? 0})` },
            { id: "OVERSTOCKED", label: `Overstocked (${forecast?.overstocked_count ?? 0})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterRisk(f.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterRisk === f.id
                  ? "bg-[#D8CFBC] text-[#11120D] font-bold shadow-xs border border-[#C5BBA4] dark:border-[#D8CFBC]"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-[#1E211A] dark:hover:bg-[#2B2E25] text-slate-600 dark:text-[#9BA3AF]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Card Content & Interactive Table */}
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Success Alert Banner */}
        <AnimatePresence>
          {draftSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-[#D8CFBC]/20 border-b border-[#D8CFBC]/40 text-xs text-[#565449] dark:text-[#D8CFBC] flex items-center justify-between gap-2 px-4"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#565449] dark:text-[#D8CFBC]" />
                <span className="truncate">
                  Drafted Purchase Order <strong>{draftSuccess.poNumber}</strong> with {draftSuccess.supplierName} for{" "}
                  <strong>{draftSuccess.quantity} units</strong> ({formatINR(draftSuccess.totalCost)})
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/purchasing" className="font-semibold underline hover:text-[#11120D] dark:hover:text-white">
                  View in POs →
                </Link>
                <button onClick={() => setDraftSuccess(null)} className="text-slate-400 hover:text-white px-1">
                  ✕
                </button>
              </div>
            </motion.div>
          )}

          {draftError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-500 flex items-center justify-between gap-2 px-4"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{draftError}</span>
              </div>
              <button onClick={() => setDraftError(null)} className="text-slate-400 hover:text-white px-1">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#14171F] text-slate-500 dark:text-[#9BA3AF] font-medium border-b border-slate-200 dark:border-[#22242B]">
                <tr>
                  <th className="py-2.5 px-3.5">Product / SKU</th>
                  <th className="py-2.5 px-3 text-right">Available</th>
                  <th className="py-2.5 px-3 text-right">Daily Velocity</th>
                  <th className="py-2.5 px-3">Runway Status</th>
                  <th className="py-2.5 px-3">Estimated Depletion</th>
                  <th className="py-2.5 px-3 text-right">Suggested PO</th>
                  <th className="py-2.5 px-3 text-center">Replenish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E211A]">
                {filteredItems.map((item) => {
                  const isCritical = item.stockout_risk === "CRITICAL";
                  const isWarning = item.stockout_risk === "WARNING";
                  const isDrafting = draftingId === item.product_id;
                  const runwayPct = Math.min(100, Math.max(8, Math.round(((item.days_of_inventory ?? 30) / 45) * 100)));

                  return (
                    <tr
                      key={item.product_id}
                      className="hover:bg-slate-50 dark:hover:bg-[#18191E]/50 transition-colors"
                    >
                      {/* Product & SKU */}
                      <td className="py-2.5 px-3.5 max-w-[220px]">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-[#7C8189] font-mono">
                          <span>{item.sku}</span>
                          {item.category_name && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[100px] text-slate-500 dark:text-[#9BA3AF]">
                                {item.category_name}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Available Stock */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {item.available_stock}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          on-hand: {item.current_stock}
                        </span>
                      </td>

                      {/* Daily Sales Velocity */}
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        <span className="font-medium text-slate-700 dark:text-[#CBD5E1]">
                          {item.daily_velocity} /day
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ROP: {item.reorder_point}
                        </span>
                      </td>

                      {/* Runway Status & Bar */}
                      <td className="py-2.5 px-3 min-w-[150px]">
                        <div className="flex items-center justify-between mb-1">
                          {getRiskBadge(item.stockout_risk, item.days_of_inventory)}
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-[#22242B] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getRunwayBarColor(item.stockout_risk)}`}
                            style={{ width: `${runwayPct}%`, ...getRunwayBarStyle(item.stockout_risk) }}
                          />
                        </div>
                      </td>

                      {/* Estimated Depletion Date */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-[#CBD5E1]">
                        {item.estimated_stockout_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px]">{item.estimated_stockout_date}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-mono">&gt; 180 Days</span>
                        )}
                        <span className="text-[10px] text-slate-400 block truncate">
                          Supplier: {item.primary_supplier_name || "Factory Direct"}
                        </span>
                      </td>

                      {/* Suggested PO Qty & Cost */}
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {item.suggested_reorder_qty > 0 ? (
                          <>
                            <span className="font-semibold text-slate-900 dark:text-[#F4F5F7]">
                              +{item.suggested_reorder_qty} units
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-[#7C8189] block truncate font-mono" title={formatINR(item.projected_reorder_cost)}>
                              {formatINR(item.projected_reorder_cost, { autoDecimals: true })}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 1-Click Auto-Draft PO Action */}
                      <td className="py-2.5 px-3 text-center">
                        {isCritical || isWarning ? (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isDrafting}
                            onClick={() => handleAutoDraft(item)}
                            className="h-7 text-[11px] px-2.5 font-bold shadow-xs whitespace-nowrap"
                          >
                            {isDrafting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Zap className="w-3 h-3 mr-1 fill-current" />
                                Auto-PO
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Healthy</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 text-slate-400 dark:text-[#7C8189]">
            <CheckCircle2 className="w-8 h-8 text-[#565449] dark:text-[#D8CFBC]" />
            <p className="text-xs font-medium text-slate-700 dark:text-[#CBD5E1]">
              No inventory items match filter &quot;{filterRisk}&quot;.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
