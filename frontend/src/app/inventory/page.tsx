"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Boxes,
  Plus,
  History,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Sliders,
  DollarSign,
  Package,
  X,
} from "lucide-react";
import {
  fetchInventorySummaries,
  recordMovementApi,
  fetchProductMovements,
} from "@/lib/api";
import { ProductStockSummary, InventoryMovement } from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { motion } from "framer-motion";
import { getTransition, useReducedMotion, createStaggerContainer, slideUpVariants } from "@/motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Modal } from "@/components/ui/Modal";
import { TableSkeleton, ListSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function InventoryPage() {
  const { currentOrg } = useTenant();
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
  const itemVariants = slideUpVariants(prefersReducedMotion);

  const [summaries, setSummaries] = useState<ProductStockSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Record Movement Modal State
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductStockSummary | null>(null);
  const [movementType, setMovementType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [quantity, setQuantity] = useState<number>(10);
  const [reference, setReference] = useState<string>("Supplier Receiving");
  const [notes, setNotes] = useState<string>("");
  const [movementError, setMovementError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // History Drawer State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<ProductStockSummary | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState<boolean>(false);

  const loadInventory = async () => {
    if (summaries.length === 0) setLoading(true);
    try {
      const data = await fetchInventorySummaries();
      setSummaries(data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [currentOrg?.id]);

  const handleOpenMovementModal = (item?: ProductStockSummary) => {
    const target = item || summaries[0] || null;
    setSelectedProduct(target);
    setMovementType("IN");
    setQuantity(10);
    setReference("Supplier Receiving");
    setNotes("");
    setMovementError("");
    setMovementModalOpen(true);
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    setMovementError("");
    try {
      await recordMovementApi({
        product_id: selectedProduct.product.id,
        movement_type: movementType,
        quantity: Number(quantity),
        reference,
        notes,
      });
      setMovementModalOpen(false);
      await loadInventory();
    } catch (err: any) {
      setMovementError(err.message || "Failed to record movement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistory = async (item: ProductStockSummary) => {
    setHistoryItem(item);
    setHistoryModalOpen(true);
    setLoadingMovements(true);
    try {
      const history = await fetchProductMovements(item.product.id);
      setMovements(history);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingMovements(false);
    }
  };

  // KPIs
  const totalSkus = summaries.length;
  const totalItems = summaries.reduce((acc, s) => acc + s.on_hand_quantity, 0);
  const lowStockCount = summaries.filter((s) => s.is_low_stock).length;
  const totalValuation = summaries.reduce((acc, s) => acc + s.total_cost_value, 0);

  // Live preview of calculation in modal
  const previewCurrent = selectedProduct ? selectedProduct.on_hand_quantity : 0;
  let previewNewStock = previewCurrent;
  if (movementType === "IN") previewNewStock = previewCurrent + Number(quantity || 0);
  else if (movementType === "OUT") previewNewStock = previewCurrent - Number(quantity || 0);
  else if (movementType === "ADJUSTMENT") previewNewStock = Number(quantity || 0);

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Title Bar */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        variants={itemVariants}
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Inventory Movement Ledger
            </h1>
            <Badge variant="info" className="capitalize">
              {currentOrg?.name}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            Append-only transaction ledger with automatic real-time stock computation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadInventory}
            disabled={loading}
            className="gap-1.5 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenMovementModal()}
            disabled={summaries.length === 0}
            className="gap-1.5 bg-zinc-900 text-white hover:bg-black shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Record Movement
          </Button>
        </div>
      </motion.div>

      {/* Top KPI Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-700">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Tracked SKUs</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900">
                  <AnimatedCounter value={totalSkus} />
                </span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/60">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Units in Stock</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900">
                  <AnimatedCounter value={totalItems} />
                </span>
                <span className="text-xs text-zinc-400 font-mono">units</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className={`p-2.5 rounded-lg ${
                lowStockCount > 0
                  ? "bg-zinc-100 text-zinc-900 border border-zinc-200/60"
                  : "bg-zinc-100 text-zinc-900 border border-zinc-200/60"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Low Stock Alerts</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900">
                  <AnimatedCounter value={lowStockCount} />
                </span>
                <Badge variant={lowStockCount > 0 ? "warning" : "success"}>
                  {lowStockCount > 0 ? "Needs Reorder" : "Healthy"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/60">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Stock Value (Cost)</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={totalValuation} prefix="₹" formatINR decimals={2} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Inventory Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden bg-white border-zinc-200 shadow-sm">
          <CardHeader className="py-3 px-4 bg-zinc-50 border-b border-zinc-200">
            <CardTitle className="text-sm font-semibold text-zinc-700">
              Live On-Hand Stock Levels & Reorder Thresholds
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">On-Hand Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Level</th>
                  <th className="py-3 px-4 text-right">Avg Cost</th>
                  <th className="py-3 px-4 text-right">Total Valuation</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <TableSkeleton rows={6} columns={["w-24", "w-44", "w-28", "w-16", "w-16", "w-20", "w-24", "w-24", "w-20"]} />
                      <SkeletonAnnouncer label="Calculating current ledger balances" />
                    </td>
                  </tr>
                ) : summaries.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        compact
                        icon={Boxes}
                        title="No inventory data available"
                        description="Create products or record an incoming stock movement to begin tracking."
                      />
                    </td>
                  </tr>
                ) : (
                  summaries.map((s) => (
                    <tr
                      key={s.product.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        s.is_low_stock ? "bg-zinc-100/50" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        {s.product.sku}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-zinc-900">{s.product.name}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">
                        {s.product.category?.name || "General"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded ${
                            s.is_low_stock
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-800"
                          }`}
                        >
                          {s.on_hand_quantity} {s.product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-zinc-500">
                        {s.reorder_point} {s.product.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-600">
                        ₹{Number(s.product.cost_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900">
                        ₹{Number(s.total_cost_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.is_low_stock ? (
                          <Badge variant="warning">
                            Reorder Required
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            Adequate
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenMovementModal(s)}
                            className="h-7 text-xs px-2 gap-1 border-zinc-300 hover:bg-zinc-100"
                          >
                            <Plus className="w-3 h-3" />
                            Adjust
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenHistory(s)}
                            className="h-7 text-xs px-2 gap-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                          >
                            <History className="w-3 h-3" />
                            Ledger
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Record Movement Modal */}
      <Modal
        isOpen={movementModalOpen && !!selectedProduct}
        onClose={() => setMovementModalOpen(false)}
        maxWidth="md"
        className="p-6"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">
                  Record Stock Movement
                </h3>
                <p className="text-xs text-zinc-500">
                  Appends an immutable entry to the inventory movement ledger
                </p>
              </div>
              <button
                onClick={() => setMovementModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {movementError && (
              <div className="text-xs text-zinc-900 bg-zinc-100 border border-zinc-300 p-2.5 rounded font-medium">
                {movementError}
              </div>
            )}

            <form onSubmit={handleMovementSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Select Product
                </label>
                <select
                  value={selectedProduct.product.id}
                  onChange={(e) => {
                    const found = summaries.find((s) => s.product.id === e.target.value);
                    if (found) setSelectedProduct(found);
                  }}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                >
                  {summaries.map((s) => (
                    <option key={s.product.id} value={s.product.id}>
                      {s.product.name} ({s.product.sku}) — Available: {s.on_hand_quantity}{" "}
                      {s.product.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type Tabs with Fluid Indicator */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Movement Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
                  {[
                    { type: "IN", label: "Stock IN", icon: TrendingUp },
                    { type: "OUT", label: "Stock OUT", icon: TrendingDown },
                    { type: "ADJUSTMENT", label: "Set Count", icon: Sliders },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = movementType === tab.type;
                    return (
                      <button
                        key={tab.type}
                        type="button"
                        onClick={() => setMovementType(tab.type as any)}
                        className={`relative text-xs py-2 px-2.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors z-10 ${
                          isSelected ? "text-white font-semibold" : "text-zinc-600 hover:text-zinc-950"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId={prefersReducedMotion ? undefined : "activeMovementTab"}
                            className="absolute inset-0 bg-zinc-950 rounded-md shadow-xs -z-10"
                            transition={getTransition("normal", prefersReducedMotion)}
                          />
                        )}
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-zinc-500"}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Input */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={
                    movementType === "ADJUSTMENT"
                      ? "New Count Total *"
                      : "Quantity Magnitude *"
                  }
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  required
                />

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Resulting Stock
                  </label>
                  <div
                    className={`px-3 py-2 text-sm font-mono font-bold rounded-md border ${
                      previewNewStock < 0
                        ? "bg-zinc-100 text-zinc-950 border-zinc-400 font-bold"
                        : "bg-zinc-50 text-zinc-800 border-zinc-200"
                    }`}
                  >
                    {previewNewStock} {selectedProduct.product.unit}
                  </div>
                </div>
              </div>

              <Input
                label="Reference / Reason *"
                placeholder="e.g. PO-2024, Sales Dispatch #112, Audit recount"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />

              <Input
                label="Notes (Optional)"
                placeholder="Additional context or batch info..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMovementModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || previewNewStock < 0}
                  className="bg-zinc-900 text-white"
                >
                  {submitting ? "Writing Ledger..." : "Confirm & Post Ledger"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Movement History Audit Drawer Modal */}
      <Modal
        isOpen={historyModalOpen && !!historyItem}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="2xl"
        className="p-6"
      >
        {historyItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">
                  Ledger Audit Trail: {historyItem.product.name}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  SKU: {historyItem.product.sku} — Current On-Hand:{" "}
                  <span className="font-bold text-zinc-800">
                    {historyItem.on_hand_quantity} {historyItem.product.unit}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingMovements ? (
              <div className="p-4">
                <ListSkeleton rows={4} />
                <SkeletonAnnouncer label="Loading movement transactions" />
              </div>
            ) : movements.length === 0 ? (
              <EmptyState
                compact
                icon={History}
                title="No movements recorded yet"
                description="Stock changes are recorded as append-only ledger movements. Record an IN or OUT movement to see the timeline."
              />
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date / Time</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Quantity Change</th>
                      <th className="py-2.5 px-3">Reference / Reason</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50">
                        <td className="py-2.5 px-3 text-zinc-500 font-mono">
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.movement_type === "IN"
                                ? "bg-zinc-950 text-white font-semibold"
                                : m.movement_type === "OUT"
                                ? "bg-zinc-200 text-zinc-900 border border-zinc-300 font-semibold"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold"
                            }`}
                          >
                            {m.movement_type}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            m.quantity_change > 0 ? "text-zinc-950 font-bold" : "text-zinc-600 font-bold"
                          }`}
                        >
                          {m.quantity_change > 0
                            ? `+${m.quantity_change}`
                            : m.quantity_change}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-800">
                          {m.reference}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 truncate max-w-xs">
                          {m.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-zinc-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
