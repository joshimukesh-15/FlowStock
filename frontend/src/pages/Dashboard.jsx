"use client";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Tabs } from "@/components/ui/Tabs";
import { StatCard } from "@/components/ui/StatCard";
import { KpiGrid } from "@/components/ui/KpiGrid";
import { StatRow, StatCol } from "@/components/ui/StatRow";
import { RefreshCw, TrendingUp, AlertTriangle, ArrowRightLeft, Building2, Package, ShoppingCart, Truck, FileText, Clock, ExternalLink, IndianRupee, CheckCircle2, ChevronRight, Boxes, ArrowUpRight, AlertCircle, Warehouse as WarehouseIcon, Zap, Cpu, ChevronDown, Check, } from "lucide-react";
import { fetchDashboardSummary, fetchAvailableJobs, fetchJobExecutions, triggerJobApi, } from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { useRealtime } from "@/context/WebSocketContext";
import { formatINR } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion, createStaggerContainer, slideUpVariants, pageEnterVariants } from "@/motion";
import { AnimatedProgressBar } from "@/components/ui/AnimatedProgressBar";
import { CardSkeleton, KpiRowSkeleton, FilterBarSkeleton, TableSkeleton, Skeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { RevenueVelocityMatrix } from "@/components/dashboard/RevenueVelocityMatrix";
import { OrderStatusDistribution } from "@/components/dashboard/OrderStatusDistribution";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";

export default function HomePage() {
    const [summary, setSummary] = useState(null);
    const prefersReducedMotion = useReducedMotion();
    const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
    const itemVariants = slideUpVariants(prefersReducedMotion);
    const [availableJobs, setAvailableJobs] = useState([]);
    const [jobExecutions, setJobExecutions] = useState([]);
    const [runningJob, setRunningJob] = useState(null);
    const [jobActionMsg, setJobActionMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastChecked, setLastChecked] = useState("");
    const [activeTab, setActiveTab] = useState("inventory");
    const { currentOrg } = useTenant();
    const { subscribe } = useRealtime();
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryData, jobsData, executionsData] = await Promise.all([
                fetchDashboardSummary(),
                fetchAvailableJobs().catch(() => []),
                fetchJobExecutions(10).catch(() => []),
            ]);
            setSummary(summaryData);
            setAvailableJobs(jobsData);
            setJobExecutions(executionsData);
            setLastChecked(new Date().toLocaleTimeString());
        }
        catch (err) {
            setError(err.message || "Failed to load dashboard data");
        }
        finally {
            setLoading(false);
        }
    };
    const handleRunJob = async (jobName) => {
        setRunningJob(jobName);
        setJobActionMsg(null);
        try {
            const res = await triggerJobApi(jobName);
            setJobActionMsg({
                text: res.message + (res.job_execution.result_summary ? ` (${res.job_execution.result_summary})` : ""),
                type: "success",
            });
            const [jobsData, executionsData, summaryData] = await Promise.all([
                fetchAvailableJobs().catch(() => []),
                fetchJobExecutions(10).catch(() => []),
                fetchDashboardSummary().catch(() => null),
            ]);
            setAvailableJobs(jobsData);
            setJobExecutions(executionsData);
            if (summaryData)
                setSummary(summaryData);
        }
        catch (err) {
            setJobActionMsg({
                text: err.message || `Failed to run job ${jobName}`,
                type: "error",
            });
        }
        finally {
            setRunningJob(null);
        }
    };
    useEffect(() => {
        loadData();
    }, [currentOrg?.id]);
    // Real-time WebSocket subscriptions
    useEffect(() => {
        const unsubOrder = subscribe("ORDER_UPDATED", () => {
            loadData();
        });
        const unsubInv = subscribe("INVENTORY_UPDATED", () => {
            loadData();
        });
        const unsubJob = subscribe("JOB_COMPLETED", () => {
            loadData();
        });
        return () => {
            unsubOrder();
            unsubInv();
            unsubJob();
        };
    }, [subscribe]);
    const dashboardTabs = [
        {
            id: "inventory",
            label: "Inventory",
            icon: Boxes,
            count: (summary?.inventory.low_stock_count ?? 0) > 0 ? `${summary?.inventory.low_stock_count} alerts` : undefined,
        },
        {
            id: "logistics",
            label: "Logistics & Supply",
            icon: Truck,
            count: summary?.logistics.in_transit_count ? `${summary.logistics.in_transit_count} active` : undefined,
        },
        {
            id: "jobs",
            label: "Background Jobs",
            icon: Cpu,
            count: availableJobs.length > 0 ? availableJobs.length : undefined,
        },
        {
            id: "activity",
            label: "Audit Stream",
            icon: Clock,
            count: summary?.recent_activities.length ? summary.recent_activities.length : undefined,
        },
    ];

    if (loading && !summary) {
      return (
        <div className="max-w-7xl mx-auto space-y-3 pb-12" role="presentation">
          <SkeletonAnnouncer label="Loading executive operations cockpit" />
          <div className="flex items-center justify-between pb-1">
            <div className="space-y-1">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-3.5 w-96 max-w-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-[#323744] bg-white dark:bg-[#181A20]/60">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <KpiRowSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-7 h-64 rounded-lg border border-slate-200 dark:border-[#323744] p-4 space-y-3 bg-white dark:bg-[#181A20]/60">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-44 w-full rounded-md" />
            </div>
            <div className="lg:col-span-5 h-64 rounded-lg border border-slate-200 dark:border-[#323744] p-4 space-y-3 bg-white dark:bg-[#181A20]/60">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-44 w-full rounded-md" />
            </div>
          </div>
          <FilterBarSkeleton />
          <TableSkeleton rows={4} />
        </div>
      );
    }

    return (<motion.div variants={pageEnterVariants(prefersReducedMotion)} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-3 pb-12">
      {/* Header Bar */}
      <PageHeader title="Operations Cockpit" subtitle={`Real-time telemetry for ${currentOrg?.name || "Acme Logistics"}`} actions={<div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-400 dark:text-[#7C8189] font-mono">
              Synced {lastChecked || "now"}
            </span>
            <RefreshButton onClick={loadData} isRefreshing={loading} className="h-7 text-xs" />
          </div>}/>

      {/* Interactive Quick Actions Bar */}
      <motion.div variants={itemVariants}>
        <QuickActionsBar summary={summary} />
      </motion.div>

      {error && (<motion.div variants={itemVariants}>
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        </motion.div>)}

      {/* ROW 1: 4 Key Financial & Capital KPI Cards */}
      {loading && !summary ? (
        <KpiGrid aria-hidden="true">
          <Card className="rounded-lg border-slate-200 dark:border-[#323744] shadow-none">
            <CardSkeleton />
          </Card>
          <Card className="rounded-lg border-slate-200 dark:border-[#323744] shadow-none">
            <CardSkeleton />
          </Card>
          <Card className="rounded-lg border-slate-200 dark:border-[#323744] shadow-none">
            <CardSkeleton />
          </Card>
          <Card className="rounded-lg border-slate-200 dark:border-[#323744] shadow-none">
            <CardSkeleton />
          </Card>
        </KpiGrid>
      ) : (
        <KpiGrid>
          <StatCard title="Invoiced revenue" value={summary ? summary.financials.total_invoiced : 0} prefix="₹" formatINR trend={{ value: 14.8, label: "vs 30d" }} icon={IndianRupee} subText={<span className="flex items-center justify-between w-full">
                <span>
                  Collected:{" "}
                  <strong className="text-slate-800 dark:text-[#E2E8F0] tabular-nums font-mono">
                    {formatINR(summary?.financials.total_collected || 0)}
                  </strong>
                </span>
                <span className="font-semibold tabular-nums">
                  {summary?.financials.collection_rate_pct || 0}%
                </span>
              </span>} progress={summary?.financials.collection_rate_pct || 0} progressLabel="Invoice collection rate"/>

          <StatCard title="Accounts receivable" value={summary ? summary.financials.total_outstanding : 0} prefix="₹" formatINR trend={{ value: -4.2, invertColors: true, label: "aging" }} icon={FileText} subText={<span className="flex items-center justify-between w-full">
                <span>
                  Pending:{" "}
                  <strong className="text-slate-800 dark:text-[#E2E8F0] tabular-nums font-mono">
                    {summary?.financials.pending_invoices_count || 0} bills
                  </strong>
                </span>
                {(summary?.financials.overdue_invoices_count || 0) > 0 ? (<Badge variant="danger" className="text-[10px] py-0 px-1.5">
                    {summary?.financials.overdue_invoices_count} overdue
                  </Badge>) : (<span className="text-slate-400 dark:text-[#7C8189] text-[11px]">0 overdue</span>)}
              </span>}/>

          <StatCard title="Inventory valuation" value={summary ? summary.inventory.total_cost_valuation : 0} prefix="₹" formatINR trend={{ value: 8.6, label: "turnover" }} icon={Boxes} subText={<span className="flex items-center justify-between w-full">
                <span>
                  Retail:{" "}
                  <strong className="text-slate-800 dark:text-[#E2E8F0] tabular-nums font-mono">
                    {formatINR(summary?.inventory.total_retail_valuation || 0)}
                  </strong>
                </span>
                <span className="text-slate-500 dark:text-[#9BA3AF] tabular-nums">
                  {(summary?.inventory.total_units_on_hand || 0).toLocaleString("en-IN")} units
                </span>
              </span>}/>

          <StatCard title="Active order book" value={summary ? summary.orders.active_order_book_value : 0} prefix="₹" formatINR trend={{ value: 19.4, label: "intake" }} icon={ShoppingCart} subText={<span className="flex items-center justify-between w-full">
                <span>
                  Confirmed:{" "}
                  <strong className="text-slate-800 dark:text-[#E2E8F0] tabular-nums">
                    {summary?.orders.confirmed_count || 0}
                  </strong>
                </span>
                <span>
                  Total:{" "}
                  <strong className="text-slate-800 dark:text-[#E2E8F0] tabular-nums">
                    {summary?.orders.total_orders || 0}
                  </strong>
                </span>
              </span>}/>
        </KpiGrid>)}

      {/* ROW 2: Financial Velocity Matrix & Order Status Distribution (12 cols) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <RevenueVelocityMatrix summary={summary} className="lg:col-span-7"/>
        <OrderStatusDistribution summary={summary} className="lg:col-span-5"/>
      </motion.div>

      {/* Secondary Tabbed Section */}
      <motion.div variants={itemVariants} className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-[#323744]">
          <Tabs tabs={dashboardTabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" size="sm"/>
          <span className="text-[11px] text-slate-400 dark:text-[#7C8189] font-mono hidden sm:inline">
            Section: {activeTab.toUpperCase()}
          </span>
        </div>

        {/* Tab 1: Inventory */}
        {activeTab === "inventory" && (<div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Stock Replenishment & Safety Thresholds (7 cols) */}
              <Card spotlight className="lg:col-span-7 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-3.5 pb-2">
                  <div className="space-y-0.5">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] flex items-center gap-1.5">
                      <AlertTriangle className={`w-3.5 h-3.5 ${(summary?.inventory.low_stock_count || 0) > 0
                ? "text-amber-500"
                : "text-slate-400"}`}/>
                      Stock Replenishment & Safety Thresholds
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                      SKUs requiring replenishment to prevent stockouts
                    </p>
                  </div>
                  <Badge variant={(summary?.inventory.low_stock_count || 0) > 0 ? "warning" : "success"}>
                    {summary?.inventory.low_stock_count || 0} At Risk
                  </Badge>
                </CardHeader>
                <CardContent className="p-3.5 pt-0 flex-1 flex flex-col">
                  {summary && summary.inventory.low_stock_items.length > 0 ? (<div className="space-y-2 flex-1">
                      <div className="border border-slate-200 dark:border-[#323744] rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-[#14171F] text-slate-600 dark:text-[#9BA3AF] font-medium border-b border-slate-200 dark:border-[#323744]">
                            <tr>
                              <th className="py-2 px-3">SKU</th>
                              <th className="py-2 px-3">Product Name</th>
                              <th className="py-2 px-3 text-right">On Hand</th>
                              <th className="py-2 px-3 text-right">Safety Min</th>
                              <th className="py-2 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-[#262A34]">
                            {summary.inventory.low_stock_items.map((item) => (<tr key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-[#23262F]/50 transition-colors">
                                <td className="py-2 px-3 font-mono text-slate-700 dark:text-[#CBD5E1] font-medium">
                                  {item.sku}
                                </td>
                                <td className="py-2 px-3 text-slate-900 dark:text-[#F4F5F7] font-medium truncate max-w-[160px]">
                                  {item.name}
                                </td>
                                <td className="py-2 px-3 text-right font-semibold tabular-nums text-slate-900 dark:text-[#F4F5F7]">
                                  {item.current_stock} {item.unit}
                                </td>
                                <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-[#9BA3AF]">
                                  {item.reorder_point} {item.unit}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <Badge variant="danger" className="text-[10px] py-0 px-1.5">
                                    Reorder
                                  </Badge>
                                </td>
                              </tr>))}
                          </tbody>
                        </table>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <Link to="/purchasing">
                          <Button size="sm" variant="primary">
                            <span>Create Purchase Order</span>
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                          </Button>
                        </Link>
                      </div>
                    </div>) : (<div className="h-[120px] flex flex-col items-center justify-center text-center p-4 rounded-lg border border-dashed border-slate-200 dark:border-[#323744] bg-slate-50/40 dark:bg-[#14171F]/30">
                      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#CBD5E1] font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>
                        <span>All stock levels healthy across {summary?.inventory.total_skus || 0} catalog items.</span>
                      </div>
                      <Link to="/inventory" className="mt-2 text-xs text-emerald-600 dark:text-[#92AA97] hover:underline inline-flex items-center gap-1">
                        View Inventory Ledger <ArrowUpRight className="w-3 h-3"/>
                      </Link>
                    </div>)}
                </CardContent>
              </Card>

              {/* Multi-Facility Stock Distribution (5 cols) */}
              <Card spotlight className="lg:col-span-5 flex flex-col">
                <CardHeader className="p-3.5 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] flex items-center gap-1.5">
                    <WarehouseIcon className="w-3.5 h-3.5 text-slate-500"/>
                    Multi-Facility Distribution
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                    Working stock units and capital across warehouses
                  </p>
                </CardHeader>
                <CardContent className="p-3.5 pt-0 flex-1 space-y-2">
                  {summary && summary.warehouses.length > 0 ? (summary.warehouses.map((wh) => (<div key={wh.warehouse_id} className="p-2.5 rounded-lg border border-slate-200 dark:border-[#323744] hover:bg-slate-50 dark:hover:bg-[#23262F]/40 transition-colors space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-900 dark:text-[#F4F5F7]">{wh.name}</span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-[#9BA3AF] bg-slate-100 dark:bg-[#23262F] px-1 py-0.2 rounded border border-slate-200/50 dark:border-[#3A404F]/50">
                              {wh.code}
                            </span>
                          </div>
                          <span className="font-semibold tabular-nums text-slate-800 dark:text-[#E2E8F0]">
                            {wh.pct_of_total_stock}% ({wh.total_units} units)
                          </span>
                        </div>
                        <AnimatedProgressBar value={wh.pct_of_total_stock} label={`${wh.name} share of stock units`} className="bg-[#92AA97] h-1.5"/>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-[#9BA3AF] pt-0.5">
                          <span className="truncate max-w-[140px]">{wh.location || "Central Facility"}</span>
                          <span>
                            Capital:{" "}
                            <strong className="text-slate-800 dark:text-[#E2E8F0] tabular-nums font-mono">
                              {formatINR(wh.cost_valuation)}
                            </strong>
                          </span>
                        </div>
                      </div>))) : (<div className="h-[120px] flex items-center justify-center text-xs text-slate-400 text-center">
                      No warehouse distribution recorded yet
                    </div>)}
                </CardContent>
              </Card>
            </div>

            {/* Fast-Moving SKUs & Revenue Drivers */}
            <Card spotlight className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-500"/>
                    Fast-Moving SKUs & Revenue Drivers
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                    Top products ranked by sales order volume and gross revenue
                  </p>
                </div>
                <Link to="/products">
                  <Button variant="outline" size="xs">
                    <span>All Products</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0"/>
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {summary && summary.top_products.length > 0 ? (<div className="border border-slate-200 dark:border-[#323744] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#14171F] text-slate-600 dark:text-[#9BA3AF] font-medium border-b border-slate-200 dark:border-[#323744]">
                        <tr>
                          <th className="py-2 px-3 w-10">#</th>
                          <th className="py-2 px-3">SKU & Item</th>
                          <th className="py-2 px-3 text-right">Units Sold</th>
                          <th className="py-2 px-3 text-right">Revenue (₹)</th>
                          <th className="py-2 px-3 text-right">Current Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#262A34]">
                        {summary.top_products.map((item, idx) => (<tr key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-[#23262F]/50 transition-colors">
                            <td className="py-2 px-3 font-mono text-slate-400 dark:text-[#7C8189]">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <span className="font-medium text-slate-900 dark:text-[#F4F5F7]">{item.name}</span>
                              <span className="font-mono text-[11px] text-slate-500 dark:text-[#9BA3AF] ml-2">
                                {item.sku}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-slate-800 dark:text-[#E2E8F0] tabular-nums">
                              {item.units_sold.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-[#F4F5F7] tabular-nums font-mono">
                              {formatINR(item.total_revenue)}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600 dark:text-[#9BA3AF] font-mono tabular-nums">
                              {item.current_stock}
                            </td>
                          </tr>))}
                      </tbody>
                    </table>
                  </div>) : (<div className="h-[100px] flex items-center justify-center text-xs text-slate-400 text-center">
                    No sales order volume recorded yet
                  </div>)}
              </CardContent>
            </Card>
          </div>)}

        {/* Tab 2: Logistics & Supply */}
        {activeTab === "logistics" && (<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Logistics Delivery Radar */}
            <Card spotlight className="flex flex-col justify-between">
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-500"/>
                    Logistics Delivery Radar
                  </CardTitle>
                  <Link to="/shipments">
                    <Button variant="outline" size="xs">
                      <span>Shipments</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0"/>
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">Live parcel and freight tracking</p>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-3">
                <StatRow columns={4}>
                  <StatCol label="In Transit" value={summary?.logistics.in_transit_count || 0}/>
                  <StatCol label="Delivered" value={summary?.logistics.delivered_count || 0}/>
                  <StatCol label="Preparing" value={summary?.logistics.preparing_count || 0}/>
                  <StatCol label="Total Consignments" value={summary?.logistics.total_shipments || 0}/>
                </StatRow>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9BA3AF] pt-1">
                  <span>
                    On-time Delivery Rate:{" "}
                    <strong className="text-slate-800 dark:text-[#E2E8F0] tabular-nums">98.4%</strong>
                  </span>
                  <span className="font-mono text-[11px]">Realtime Freight GPS</span>
                </div>
              </CardContent>
            </Card>

            {/* Inbound Purchasing Pipeline */}
            <Card spotlight className="flex flex-col justify-between">
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-500"/>
                    Inbound Purchasing Pipeline
                  </CardTitle>
                  <Link to="/purchasing">
                    <Button variant="outline" size="xs">
                      <span>Procurement</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0"/>
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">Supplier POs and committed spend</p>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-3">
                <StatRow columns={3}>
                  <StatCol label="Committed Spend" value={summary ? formatINR(summary.purchasing.committed_spend) : "₹0.00"}/>
                  <StatCol label="Active POs" value={summary?.purchasing.active_po_count || 0}/>
                  <StatCol label="Lifetime POs" value={summary?.purchasing.total_purchase_orders || 0}/>
                </StatRow>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9BA3AF] pt-1">
                  <span>
                    Ledger Mode:{" "}
                    <strong className="text-slate-800 dark:text-[#E2E8F0]">Append-Only Receiving</strong>
                  </span>
                  <Badge variant="info" className="text-[10px] py-0 px-1.5">
                    3-Way Matched
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>)}

        {/* Tab 3: Background Jobs */}
        {activeTab === "jobs" && (<div className="space-y-3">
            {jobActionMsg && (<div className={`p-3 rounded-lg text-xs flex items-center justify-between transition-all ${jobActionMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"}`}>
                <div className="flex items-center gap-2">
                  {jobActionMsg.type === "success" ? (<CheckCircle2 className="w-4 h-4 shrink-0"/>) : (<AlertCircle className="w-4 h-4 shrink-0"/>)}
                  <span>{jobActionMsg.text}</span>
                </div>
                <button onClick={() => setJobActionMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-4">
                  ×
                </button>
              </div>)}

            {/* 3 Compact Background Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {availableJobs.map((job) => {
                const isRunning = runningJob === job.name;
                const lastRun = job.last_run;
                return (<Card key={job.name} spotlight className="flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-600 dark:text-[#9BA3AF] bg-slate-100 dark:bg-[#23262F] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#3A404F]">
                          {job.schedule_interval}
                        </span>
                        {lastRun ? (<Badge variant={lastRun.status === "SUCCESS"
                            ? "success"
                            : lastRun.status === "RUNNING"
                                ? "info"
                                : "danger"} className="text-[10px] py-0 px-1.5">
                            {lastRun.status}
                          </Badge>) : (<Badge variant="default" className="text-[10px] py-0 px-1.5 text-slate-500 dark:text-[#9BA3AF]">
                            NEVER RUN
                          </Badge>)}
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7]">
                        {job.title}
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-[#9BA3AF] truncate" title={job.description}>
                        {job.description}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      {lastRun ? (<div className="p-2 rounded bg-slate-50 dark:bg-[#14171F]/60 border border-slate-100 dark:border-[#262A34] text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-500 dark:text-[#9BA3AF]">
                            <span>Last ({lastRun.triggered_by})</span>
                            <span className="font-mono tabular-nums">
                              {lastRun.duration_ms !== null && lastRun.duration_ms !== undefined
                            ? `${lastRun.duration_ms}ms`
                            : "-"}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-[#CBD5E1] font-medium truncate" title={lastRun.result_summary || ""}>
                            {lastRun.result_summary || "Completed"}
                          </p>
                        </div>) : (<div className="p-2 rounded bg-slate-50/50 dark:bg-[#181A20]/60 border border-dashed border-slate-200 dark:border-[#323744] text-[11px] text-slate-400 dark:text-[#7C8189] text-center">
                          Ready for initial trigger
                        </div>)}
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleRunJob(job.name)} disabled={isRunning || runningJob !== null}>
                        {isRunning ? (<>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin"/>
                            Executing...
                          </>) : (<>
                            <Zap className="w-3.5 h-3.5 text-slate-800 dark:text-[#E2E8F0]"/>
                            Run Job Now
                          </>)}
                      </Button>
                    </CardContent>
                  </Card>);
            })}
            </div>

            {/* Recent Execution Log Table */}
            {jobExecutions.length > 0 && (<Card className="rounded-lg border-slate-200 dark:border-[#323744] shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500"/>
                    Recent Background Execution Log
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                    Audit history of automated and on-demand background job runs
                  </p>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#14171F] text-slate-500 dark:text-[#9BA3AF] border-b border-slate-200 dark:border-[#323744] font-medium">
                      <tr>
                        <th className="py-2 px-4">Job Name</th>
                        <th className="py-2 px-4">Trigger</th>
                        <th className="py-2 px-4">Status</th>
                        <th className="py-2 px-4">Execution Result</th>
                        <th className="py-2 px-4 text-right">Duration</th>
                        <th className="py-2 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#262A34]">
                      {jobExecutions.slice(0, 5).map((exec) => (<tr key={exec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-4 font-mono font-medium text-slate-800 dark:text-[#E2E8F0]">
                            {exec.job_name}
                          </td>
                          <td className="py-2 px-4">
                            <span className="text-[10px] font-mono text-slate-500 dark:text-[#9BA3AF] bg-slate-100 dark:bg-[#23262F] border dark:border-[#3A404F]/60 px-1.5 py-0.5 rounded">
                              {exec.triggered_by}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <Badge variant={exec.status === "SUCCESS"
                        ? "success"
                        : exec.status === "RUNNING"
                            ? "info"
                            : "danger"} className="text-[10px] py-0 px-1.5">
                              {exec.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-4 text-slate-600 dark:text-[#CBD5E1] max-w-xs truncate">
                            {exec.result_summary || exec.error_message || "—"}
                          </td>
                          <td className="py-2 px-4 text-right font-mono tabular-nums text-slate-500 dark:text-[#9BA3AF]">
                            {exec.duration_ms !== null && exec.duration_ms !== undefined
                        ? `${exec.duration_ms}ms`
                        : "—"}
                          </td>
                          <td className="py-2 px-4 text-right font-mono tabular-nums text-slate-400 dark:text-[#7C8189]">
                            {new Date(exec.started_at).toLocaleTimeString()}
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>)}
          </div>)}

        {/* Tab 4: Activity Stream */}
        {activeTab === "activity" && (<Card spotlight className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between p-3.5 pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500"/>
                  Live Operational Event Stream
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                  Real-time chronological audit trail of all transactions and changes
                </p>
              </div>
              <Link to="/audit">
                <Button variant="outline" size="xs">
                  <span>Full Audit Trail</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0"/>
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {summary && summary.recent_activities.length > 0 ? (<div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-[#262A34]">
                  {summary.recent_activities.map((act) => (<div key={act.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={act.badge_variant} className="text-[10px] py-0 px-1.5">
                            {act.activity_type}
                          </Badge>
                          <span className="font-semibold text-slate-800 dark:text-[#E2E8F0] truncate">
                            {act.title}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-[#9BA3AF] text-[11px] truncate">
                          {act.description}
                        </p>
                      </div>
                      {act.amount !== null && act.amount !== undefined && (<span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-[#F4F5F7] text-xs shrink-0">
                          {formatINR(act.amount)}
                        </span>)}
                    </div>))}
                </div>) : (<div className="h-[120px] flex items-center justify-center text-xs text-slate-400 text-center">
                  Live chronological events from orders, movements, transfers, and payments will stream here in real time.
                </div>)}
            </CardContent>
          </Card>)}
      </motion.div>
    </motion.div>);
}
