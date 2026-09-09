"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Clock,
  ExternalLink,
  IndianRupee,
  CheckCircle2,
  ChevronRight,
  Boxes,
  Layers,
  ArrowUpRight,
  AlertCircle,
  Warehouse as WarehouseIcon,
  Zap,
  Cpu,
} from "lucide-react";
import {
  fetchHealth,
  fetchDashboardSummary,
  fetchAvailableJobs,
  fetchJobExecutions,
  triggerJobApi,
} from "@/lib/api";
import {
  HealthResponse,
  DashboardSummaryResponse,
  AvailableJob,
  JobExecution,
} from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { useRealtime } from "@/context/WebSocketContext";
import { formatINR } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReducedMotion, createStaggerContainer, slideUpVariants } from "@/motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { AnimatedProgressBar } from "@/components/ui/AnimatedProgressBar";
import { CardSkeleton, ListSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { RevenueVelocityMatrix } from "@/components/dashboard/RevenueVelocityMatrix";
import { OrderStatusDistribution } from "@/components/dashboard/OrderStatusDistribution";
import { KpiTrend } from "@/components/ui/KpiTrend";

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = createStaggerContainer(0.06, 0, prefersReducedMotion);
  const itemVariants = slideUpVariants(prefersReducedMotion);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [jobExecutions, setJobExecutions] = useState<JobExecution[]>([]);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [jobActionMsg, setJobActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");
  const { currentOrg, currentUser, organizations, switchOrganization } = useTenant();
  const { isConnected: wsConnected, subscribe } = useRealtime();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, summaryData, jobsData, executionsData] = await Promise.all([
        fetchHealth(),
        fetchDashboardSummary(),
        fetchAvailableJobs().catch(() => []),
        fetchJobExecutions(10).catch(() => []),
      ]);
      setHealth(healthData);
      setSummary(summaryData);
      setAvailableJobs(jobsData);
      setJobExecutions(executionsData);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRunJob = async (jobName: string) => {
    setRunningJob(jobName);
    setJobActionMsg(null);
    try {
      const res = await triggerJobApi(jobName);
      setJobActionMsg({
        text: res.message + (res.job_execution.result_summary ? ` (${res.job_execution.result_summary})` : ""),
        type: "success",
      });
      // Refresh jobs and dashboard summary
      const [jobsData, executionsData, summaryData] = await Promise.all([
        fetchAvailableJobs().catch(() => []),
        fetchJobExecutions(10).catch(() => []),
        fetchDashboardSummary().catch(() => null),
      ]);
      setAvailableJobs(jobsData);
      setJobExecutions(executionsData);
      if (summaryData) setSummary(summaryData);
    } catch (err: any) {
      setJobActionMsg({
        text: err.message || `Failed to run job ${jobName}`,
        type: "error",
      });
    } finally {
      setRunningJob(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg?.id]);

  // Real-time WebSocket subscriptions: refresh operational metrics without reloading
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

  const isConnected = health?.status === "healthy" || health?.status === "degraded";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6 pb-12"
    >
      {/* Header Bar */}
      <PageHeader
        title="Executive Operations Cockpit"
        subtitle="Real-time enterprise operations cockpit, financial telemetry, and live multi-facility overview."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">Updated: {lastChecked || "Loading..."}</span>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Tenant Context Hero */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-950 text-white border border-zinc-800/80 rounded-xl shadow-md">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="bg-zinc-900/20 text-zinc-100 border-zinc-900/30">
                    Live Enterprise Tenant
                  </Badge>
                  <span className="text-xs text-zinc-400 font-mono">Currency: ₹ INR (Native)</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">{currentOrg?.name || "Loading Organization..."}</h2>
                <p className="text-xs text-zinc-300">
                  Tenant Slug: <span className="font-mono text-zinc-100">{currentOrg?.slug}</span> · Operator:{" "}
                  <span className="font-semibold text-white">{currentUser?.name} ({currentUser?.role})</span> · Cross-Tenant Isolation:{" "}
                  <span className="text-zinc-200 font-semibold">Enforced</span>
                </p>
              </div>

              {/* Quick Tenant Switcher (Compact Segmented Control) */}
              <div className="flex flex-col gap-2 sm:items-end">
                <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" /> Active Workspace:
                </span>
                <div className="inline-flex items-center p-1 bg-zinc-800/90 border border-zinc-700/80 rounded-lg shadow-inner">
                  {organizations.slice(0, 2).map((org) => {
                    const isActive = currentOrg?.id === org.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => switchOrganization(org.id)}
                        className={`text-xs px-3.5 py-1.5 rounded-md font-medium transition-[transform,opacity,background-color,border-color,color] flex items-center gap-1.5 ${
                          isActive
                            ? "bg-zinc-950 text-white shadow-xs shadow font-semibold"
                            : "text-zinc-300 hover:text-white hover:bg-zinc-700/50"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{org.name}</span>
                      </button>
                    );
                  })}
                  {organizations.length > 2 && (
                    <select
                      value={currentOrg?.id}
                      onChange={(e) => switchOrganization(e.target.value)}
                      aria-label="Select organization"
                      className="text-xs bg-transparent text-zinc-300 hover:text-white px-2 py-1.5 rounded-md focus:outline-none cursor-pointer border-none font-medium ml-1"
                    >
                      <option value="" disabled className="bg-zinc-900 text-zinc-400">Other Tenants...</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id} className="bg-zinc-900 text-zinc-100">
                          {org.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        </motion.div>
      )}

      {/* ROW 1: 4 Key Financial & Capital KPI Cards */}
      {loading && !summary ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
          <Card className="border-zinc-200/60 dark:border-zinc-800/60">
            <CardSkeleton />
          </Card>
          <Card className="border-zinc-200/60 dark:border-zinc-800/60">
            <CardSkeleton />
          </Card>
          <Card className="border-zinc-200/60 dark:border-zinc-800/60">
            <CardSkeleton />
          </Card>
          <Card className="border-zinc-200/60 dark:border-zinc-800/60">
            <CardSkeleton />
          </Card>
        </motion.div>
      ) : (
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Billed Revenue & Collection */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Invoiced Revenue</span>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  <AnimatedCounter
                    value={summary ? summary.financials.total_invoiced : 0}
                    prefix="₹"
                    decimals={2}
                    formatINR
                  />
                </p>
                <KpiTrend changePct={14.8} comparisonText="vs 30d" />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                <span>
                  Collected:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    <AnimatedCounter
                      value={summary ? summary.financials.total_collected : 0}
                      prefix="₹"
                      decimals={2}
                      formatINR
                    />
                  </strong>
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  <AnimatedCounter value={summary?.financials.collection_rate_pct || 0} suffix="%" />
                </span>
              </div>
              {/* Visual Progress Bar */}
              <div className="mt-2">
                <AnimatedProgressBar value={summary?.financials.collection_rate_pct || 0} label="Invoice collection rate" className="bg-zinc-900 dark:bg-zinc-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Accounts Receivable */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Accounts Receivable</span>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                <p className="text-xl font-bold text-zinc-950 dark:text-zinc-100 font-mono">
                  <AnimatedCounter
                    value={summary ? summary.financials.total_outstanding : 0}
                    prefix="₹"
                    decimals={2}
                    formatINR
                  />
                </p>
                <KpiTrend changePct={-4.2} invertColors comparisonText="aging" />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                <span>
                  Pending:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    <AnimatedCounter value={summary?.financials.pending_invoices_count || 0} suffix=" bills" />
                  </strong>
                </span>
                <Badge variant={summary?.financials.overdue_invoices_count ? "danger" : "default"}>
                  <AnimatedCounter value={summary?.financials.overdue_invoices_count || 0} suffix=" overdue" />
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Inventory Valuation */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Inventory Valuation</span>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  <AnimatedCounter
                    value={summary ? summary.inventory.total_cost_valuation : 0}
                    prefix="₹"
                    decimals={2}
                    formatINR
                  />
                </p>
                <KpiTrend changePct={8.6} comparisonText="turnover" />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                <span>
                  Retail:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    <AnimatedCounter
                      value={summary ? summary.inventory.total_retail_valuation : 0}
                      prefix="₹"
                      decimals={2}
                      formatINR
                    />
                  </strong>
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <AnimatedCounter value={summary?.inventory.total_units_on_hand || 0} suffix=" units" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Active Order Book */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Active Order Book</span>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  <AnimatedCounter
                    value={summary ? summary.orders.active_order_book_value : 0}
                    prefix="₹"
                    decimals={2}
                    formatINR
                  />
                </p>
                <KpiTrend changePct={19.4} comparisonText="intake" />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                <span>
                  Confirmed:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    <AnimatedCounter value={summary?.orders.confirmed_count || 0} />
                  </strong>
                </span>
                <span>
                  Total:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    <AnimatedCounter value={summary?.orders.total_orders || 0} />
                  </strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      )}

      {/* ROW 2: Minimalist Financial Velocity Matrix */}
      <motion.div variants={itemVariants}>
        <RevenueVelocityMatrix summary={summary} />
      </motion.div>

      {/* ROW 3: Stock Replenishment & Order Pipeline Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Reorder Alerts & Safety Stocks (7 cols) */}
          <Card className="lg:col-span-7 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${(summary?.inventory.low_stock_count || 0) > 0 ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"}`} />
                  Stock Replenishment & Safety Thresholds
                </CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  SKUs requiring vendor replenishment to prevent operational stockouts
                </p>
              </div>
              <Badge variant={(summary?.inventory.low_stock_count || 0) > 0 ? "warning" : "success"}>
                {summary?.inventory.low_stock_count || 0} At Risk
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col">
              {summary && summary.inventory.low_stock_items.length > 0 ? (
                <div className="space-y-3 flex-1">
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Product Name</th>
                          <th className="p-2.5 text-right">On Hand</th>
                          <th className="p-2.5 text-right">Safety Min</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {summary.inventory.low_stock_items.map((item) => (
                          <tr key={item.product_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="p-2.5 font-mono text-zinc-700 dark:text-zinc-300 font-medium">{item.sku}</td>
                            <td className="p-2.5 text-zinc-900 dark:text-zinc-100 font-medium">{item.name}</td>
                            <td className="p-2.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                              {item.current_stock} {item.unit}
                            </td>
                            <td className="p-2.5 text-right text-zinc-500 dark:text-zinc-400">
                              {item.reorder_point} {item.unit}
                            </td>
                            <td className="p-2.5 text-center">
                              <Badge variant="danger">Reorder Now</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Link to="/purchasing">
                      <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                        Create Purchase Order
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="All Stock Levels Healthy"
                  description={`No SKUs are currently below their designated safety reorder points across ${summary?.inventory.total_skus || 0} catalog items.`}
                  action={
                    <Link to="/inventory">
                      <Button variant="outline" size="sm" className="text-xs">
                        View Inventory Ledger
                      </Button>
                    </Link>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Right Column: Order Status Distribution (5 cols) */}
          <OrderStatusDistribution summary={summary} className="lg:col-span-5" />
        </div>

        {/* ROW 3: Warehouse Stock Distribution & Top Selling SKUs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Warehouse Distribution (6 cols) */}
          <Card className="lg:col-span-6 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                Multi-Facility Stock Distribution
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Working stock units and capital allocated across warehouse locations
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 space-y-3">
              {loading && !summary ? (
                <div aria-hidden="true">
                  <ListSkeleton rows={3} />
                  <SkeletonAnnouncer label="Loading warehouse distribution" />
                </div>
              ) : summary && summary.warehouses.length > 0 ? (
                summary.warehouses.map((wh) => (
                  <div key={wh.warehouse_id} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">{wh.name}</span>
                        <span className="ml-2 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50">
                          {wh.code}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {wh.pct_of_total_stock}% ({wh.total_units} units)
                      </span>
                    </div>
                    {/* Visual Capacity Bar */}
                    <AnimatedProgressBar
                      value={wh.pct_of_total_stock}
                      label={`${wh.name} share of stock units`}
                      className="bg-zinc-900 dark:bg-zinc-100"
                    />
                    <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>{wh.location || "Central Facility"}</span>
                      <span>Capital: <strong className="text-zinc-800 dark:text-zinc-200">{formatINR(wh.cost_valuation)}</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  compact
                  icon={WarehouseIcon}
                  title="No warehouse distribution data"
                  description="Stock units allocated across warehouse locations will appear here once movements are recorded."
                />
              )}
            </CardContent>
          </Card>

          {/* Top Selling Products (6 cols) */}
          <Card className="lg:col-span-6 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                Fast-Moving SKUs & Revenue Drivers
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Top products ranked by sales order volume and gross revenue
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
              {summary && summary.top_products.length > 0 ? (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">SKU & Item</th>
                        <th className="p-2.5 text-right">Units Sold</th>
                        <th className="p-2.5 text-right">Revenue (₹)</th>
                        <th className="p-2.5 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {summary.top_products.map((item, idx) => (
                        <tr key={item.product_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="p-2.5 font-bold text-zinc-400 dark:text-zinc-500">{idx + 1}</td>
                          <td className="p-2.5">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                            <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{item.sku}</p>
                          </td>
                          <td className="p-2.5 text-right font-medium text-zinc-800 dark:text-zinc-200">
                            {item.units_sold.toLocaleString("en-IN")}
                          </td>
                          <td className="p-2.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                            {formatINR(item.total_revenue)}
                          </td>
                          <td className="p-2.5 text-right text-zinc-600 dark:text-zinc-400 font-mono">
                            {item.current_stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={TrendingUp}
                  title="No sales order volume yet"
                  description="Top products ranked by sales order volume and revenue will appear here after the first order is confirmed."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ROW 4: Logistics Radar, Purchasing Pipeline & Operational Stream */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Logistics Delivery Radar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                Logistics Delivery Radar
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Live parcel and freight tracking</p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{summary?.logistics.in_transit_count || 0}</p>
                  <p className="text-[11px] text-zinc-900 dark:text-zinc-300 font-medium">In Transit</p>
                </div>
                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/80">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{summary?.logistics.delivered_count || 0}</p>
                  <p className="text-[11px] text-zinc-900 dark:text-zinc-300 font-medium">Delivered</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                <span>Preparing: <strong className="text-zinc-900 dark:text-zinc-200">{summary?.logistics.preparing_count || 0}</strong></span>
                <span>Total Consignments: <strong className="text-zinc-900 dark:text-zinc-200">{summary?.logistics.total_shipments || 0}</strong></span>
              </div>
              <Link to="/shipments" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                  View Shipments & Timeline
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 2. Inbound Purchasing Commitments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                Inbound Purchasing Pipeline
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Supplier POs and committed spend</p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-950 dark:text-zinc-300 font-medium">Committed Supplier Spend</span>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {summary ? formatINR(summary.purchasing.committed_spend) : "₹0.00"}
                </p>
                <p className="text-[11px] text-zinc-950 dark:text-zinc-300">
                  Active POs awaiting receipt: <strong className="text-zinc-900 dark:text-zinc-100">{summary?.purchasing.active_po_count || 0}</strong>
                </p>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 flex justify-between">
                <span>All Lifetime POs: <strong className="text-zinc-800 dark:text-zinc-200">{summary?.purchasing.total_purchase_orders || 0}</strong></span>
                <span className="text-zinc-900 dark:text-zinc-300 font-medium">Append-Ledger Receiving</span>
              </div>
              <Link to="/purchasing" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                  Procurement & POs
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 3. Live Operational Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                Operational Event Stream
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Live chronological audit trail</p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {summary && summary.recent_activities.length > 0 ? (
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {summary.recent_activities.map((act) => (
                    <div key={act.id} className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{act.title}</span>
                        <Badge variant={act.badge_variant} className="text-[10px] py-0 px-1.5">
                          {act.activity_type}
                        </Badge>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 text-[11px] truncate">{act.description}</p>
                      {act.amount !== null && act.amount !== undefined && (
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">{formatINR(act.amount)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={Clock}
                  title="No activity events yet"
                  description="Live chronological events from orders, movements, transfers, and payments will stream here in real time."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Automated Background Jobs & Scheduled Tasks */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                <Cpu className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                Automated Background Jobs & Tasks
                <Badge variant="default" className="text-xs">Async Engine</Badge>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Native zero-broker asynchronous jobs for low-stock scanning, invoice aging checks, and daily operations digest.
              </p>
            </div>
          </div>

          {jobActionMsg && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-center justify-between transition-[transform,opacity,background-color,border-color,color] ${
                jobActionMsg.type === "success"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                  : "bg-zinc-900 text-white border border-zinc-800 font-medium"
              }`}
            >
              <div className="flex items-center gap-2">
                {jobActionMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0" />
                )}
                <span>{jobActionMsg.text}</span>
              </div>
              <button
                onClick={() => setJobActionMsg(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold ml-4"
              >
                ×
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableJobs.map((job) => {
              const isRunning = runningJob === job.name;
              const lastRun = job.last_run;
              return (
                <Card key={job.name} className="flex flex-col justify-between border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-[transform,opacity,border-color] shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                        {job.schedule_interval}
                      </span>
                      {lastRun ? (
                        <Badge
                          variant={
                            lastRun.status === "SUCCESS"
                              ? "success"
                              : lastRun.status === "RUNNING"
                              ? "info"
                              : "danger"
                          }
                          className="text-[10px] py-0 px-1.5"
                        >
                          {lastRun.status}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] py-0 px-1.5 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                          NEVER RUN
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2">
                      {job.title}
                    </CardTitle>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {job.description}
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {lastRun ? (
                      <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                          <span>Last run ({lastRun.triggered_by})</span>
                          <span>{lastRun.duration_ms !== null && lastRun.duration_ms !== undefined ? `${lastRun.duration_ms}ms` : "-"}</span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 font-medium line-clamp-2">
                          {lastRun.result_summary || "Completed without summary"}
                        </p>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                          {new Date(lastRun.started_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded bg-zinc-50/50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
                        Ready for initial trigger
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600"
                      onClick={() => handleRunJob(job.name)}
                      disabled={isRunning || runningJob !== null}
                    >
                      {isRunning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-900 dark:text-zinc-100" />
                          Executing Task...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
                          Run Job Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Execution Log Table */}
          {jobExecutions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  Recent Background Execution Log
                </CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Audit history of automated and on-demand background job runs</p>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Job Name</th>
                      <th className="py-2.5 px-4 font-medium">Trigger</th>
                      <th className="py-2.5 px-4 font-medium">Status</th>
                      <th className="py-2.5 px-4 font-medium">Execution Result</th>
                      <th className="py-2.5 px-4 font-medium text-right">Duration</th>
                      <th className="py-2.5 px-4 font-medium text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {jobExecutions.slice(0, 5).map((exec) => (
                      <tr key={exec.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        <td className="py-2.5 px-4 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                          {exec.job_name}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border dark:border-zinc-700/60 px-1.5 py-0.5 rounded">
                            {exec.triggered_by}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge
                            variant={
                              exec.status === "SUCCESS"
                                ? "success"
                                : exec.status === "RUNNING"
                                ? "info"
                                : "danger"
                            }
                            className="text-[10px] py-0 px-1.5"
                          >
                            {exec.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300 max-w-xs truncate">
                          {exec.result_summary || exec.error_message || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-zinc-500 dark:text-zinc-400">
                          {exec.duration_ms !== null && exec.duration_ms !== undefined ? `${exec.duration_ms}ms` : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right text-zinc-400 dark:text-zinc-500">
                          {new Date(exec.started_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    
  );
}
