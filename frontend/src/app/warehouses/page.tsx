"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Warehouse as WarehouseIcon,
  Plus,
  ArrowRight,
  Truck,
  CheckCircle2,
  Clock,
  Ban,
  MapPin,
  RefreshCw,
  X,
  Package,
  AlertCircle,
} from "lucide-react";
import {
  fetchWarehouses,
  createWarehouseApi,
  fetchTransfers,
  createTransferApi,
  dispatchTransferApi,
  receiveTransferApi,
  cancelTransferApi,
  fetchProducts,
} from "@/lib/api";
import { Warehouse, StockTransfer, Product } from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { WarehouseTransferVisualizer } from "@/components/ui/WarehouseTransferVisualizer";
import { Modal } from "@/components/ui/Modal";
import { TableSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { DURATION, EASING, SCALE, useReducedMotion, createStaggerContainer, slideUpVariants } from "@/motion";

export default function WarehousesPage() {
  const { currentOrg } = useTenant();
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
  const itemVariants = slideUpVariants(prefersReducedMotion);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVisualizerTransfer, setSelectedVisualizerTransfer] = useState<StockTransfer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // New Warehouse Modal State
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [warehouseIsDefault, setWarehouseIsDefault] = useState(false);
  const [warehouseError, setWarehouseError] = useState("");
  const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);

  // New Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState<number>(5);
  const [transferNotes, setTransferNotes] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const loadData = async () => {
    if (warehouses.length === 0) setLoading(true);
    try {
      const [whList, trList, prList] = await Promise.all([
        fetchWarehouses(),
        fetchTransfers(),
        fetchProducts(),
      ]);
      setWarehouses(whList);
      setTransfers(trList);
      setProducts(prList);

      if (whList.length >= 2) {
        setSourceWarehouseId(whList[0].id);
        setDestinationWarehouseId(whList[1].id);
      } else if (whList.length === 1) {
        setSourceWarehouseId(whList[0].id);
      }
      if (prList.length > 0) {
        setSelectedProductId(prList[0].id);
      }
    } catch (err) {
      console.error("Failed to load warehouse data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg?.id]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName.trim() || !warehouseCode.trim()) {
      setWarehouseError("Warehouse name and code are required.");
      return;
    }
    setWarehouseSubmitting(true);
    setWarehouseError("");
    try {
      await createWarehouseApi({
        name: warehouseName.trim(),
        code: warehouseCode.trim(),
        location: warehouseLocation.trim() || undefined,
        is_default: warehouseIsDefault,
      });
      setWarehouseModalOpen(false);
      setWarehouseName("");
      setWarehouseCode("");
      setWarehouseLocation("");
      setWarehouseIsDefault(false);
      await loadData();
    } catch (err: any) {
      setWarehouseError(err.message || "Failed to create warehouse");
    } finally {
      setWarehouseSubmitting(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !destinationWarehouseId || !selectedProductId) {
      setTransferError("Please fill out all required transfer fields.");
      return;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      setTransferError("Source and Destination warehouses must be different.");
      return;
    }
    if (transferQuantity <= 0) {
      setTransferError("Quantity must be greater than 0.");
      return;
    }

    setTransferSubmitting(true);
    setTransferError("");
    try {
      await createTransferApi({
        source_warehouse_id: sourceWarehouseId,
        destination_warehouse_id: destinationWarehouseId,
        product_id: selectedProductId,
        quantity: Number(transferQuantity),
        notes: transferNotes.trim() || undefined,
      });
      setTransferModalOpen(false);
      setTransferNotes("");
      setTransferQuantity(5);
      await loadData();
    } catch (err: any) {
      setTransferError(err.message || "Failed to create transfer");
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleDispatch = async (transferId: string) => {
    setActionLoading(transferId);
    try {
      await dispatchTransferApi(transferId);
      await loadData();
    } catch (err: any) {
      alert(`Dispatch failed: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReceive = async (transferId: string) => {
    setActionLoading(transferId);
    try {
      await receiveTransferApi(transferId);
      await loadData();
    } catch (err: any) {
      alert(`Receive failed: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (transferId: string) => {
    if (!confirm("Are you sure you want to cancel this transfer?")) return;
    setActionLoading(transferId);
    try {
      await cancelTransferApi(transferId);
      await loadData();
    } catch (err: any) {
      alert(`Cancel failed: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    if (filterStatus === "ALL") return true;
    return t.status === filterStatus;
  });

  const getStatusBadge = (status: StockTransfer["status"]) => {
    switch (status) {
      case "REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-300">
            <Clock className="w-3 h-3" />
            REQUESTED
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-300">
            <Truck className="w-3 h-3" />
            IN TRANSIT
          </span>
        );
      case "RECEIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-900/10 text-zinc-900 border border-zinc-900/20">
            <CheckCircle2 className="w-3 h-3" />
            RECEIVED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Ban className="w-3 h-3" />
            CANCELLED
          </span>
        );
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Top Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <WarehouseIcon className="w-6 h-6 text-zinc-900" />
            Warehouses & Stock Transfers
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Multi-facility inventory nodes, physical stock routing, and inter-depot logistics.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWarehouseModalOpen(true)}
            className="border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Warehouse
          </Button>
          <Button
            size="sm"
            onClick={() => setTransferModalOpen(true)}
            disabled={warehouses.length < 2}
            className="bg-zinc-950 hover:bg-black text-white shadow-xs shadow-sm"
          >
            <Truck className="w-4 h-4 mr-1.5" />
            Transfer Stock
          </Button>
        </div>
      </motion.div>

      {/* Warehouses Grid */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Storage Facilities ({warehouses.length})
          </h2>
          {warehouses.length < 2 && (
            <span className="text-xs text-zinc-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Add at least 2 warehouses to initiate inter-depot transfers.
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <Card
              key={wh.id}
              className="bg-white border-zinc-200 hover:border-zinc-300 transition-[transform,opacity,background-color,border-color,color] shadow-sm"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 text-base">{wh.name}</h3>
                      {wh.is_default && (
                        <Badge variant="success" className="text-[10px] uppercase tracking-wide">
                          Default Facility
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-zinc-900 mt-1">{wh.code}</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200">
                    <WarehouseIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Capacity is intentionally not estimated without configured limits. */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>Capacity configuration</span>
                    <span className="font-mono font-medium text-zinc-500">Not configured</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full border border-dashed border-zinc-200 bg-zinc-50" />
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100/80 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    {wh.location || "General Logistics Zone"}
                  </span>
                  <span className="text-[11px] text-zinc-500 shrink-0">
                    {new Date(wh.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

        {/* Stock Transfers Table */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-zinc-900" />
                  Inter-Warehouse Stock Transfers
                </CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Full lifecycle audit: REQUESTED → IN_TRANSIT (source deducted) → RECEIVED (destination credited).
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200 text-xs">
                {["ALL", "REQUESTED", "IN_TRANSIT", "RECEIVED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      filterStatus === status
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
              <div className="p-4">
                <TableSkeleton rows={5} columns={["w-28", "w-40", "w-48", "w-16", "w-24", "w-32", "w-24"]} />
                <SkeletonAnnouncer label="Loading stock transfers" />
              </div>
            ) : filteredTransfers.length === 0 ? (
              <EmptyState
                compact
                icon={Package}
                title="No transfers found"
                description={
                  filterStatus !== "ALL"
                    ? `No transfers with status ${filterStatus.replace("_", " ")}.`
                    : "Create an inter-warehouse transfer to balance facility stock."
                }
              />
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-700">
                    <thead className="bg-zinc-50 text-xs uppercase font-medium text-zinc-400 border-b border-zinc-100">
                      <tr>
                        <th className="py-3.5 px-4">Transfer #</th>
                        <th className="py-3.5 px-4">Product</th>
                        <th className="py-3.5 px-4">Routing Path</th>
                        <th className="py-3.5 px-4 text-right">Quantity</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4">Notes</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredTransfers.map((tr) => {
                        const isActing = actionLoading === tr.id;
                        return (
                          <tr key={tr.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-zinc-900">
                              {tr.transfer_number}
                              <div className="text-[10px] font-normal text-zinc-500 mt-0.5">
                                {new Date(tr.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-zinc-900">
                                {tr.product?.name || "Product"}
                              </div>
                              <span className="font-mono text-xs text-zinc-400">
                                {tr.product?.sku || "SKU-UNKNOWN"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => setSelectedVisualizerTransfer(tr)}
                                className="group flex items-center gap-1.5 text-xs text-left hover:text-black transition-colors"
                                title="Click to view 2D transit visualizer"
                              >
                                <span className="font-medium text-zinc-700 group-hover:text-zinc-950 underline decoration-zinc-300 group-hover:decoration-zinc-900 underline-offset-2">
                                  {tr.source_warehouse?.name || "Source WH"}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                <span className="font-medium text-zinc-700 group-hover:text-zinc-950 underline decoration-zinc-300 group-hover:decoration-zinc-900 underline-offset-2">
                                  {tr.destination_warehouse?.name || "Dest WH"}
                                </span>
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-900">
                              {tr.quantity}{" "}
                              <span className="text-xs text-zinc-400 font-normal">
                                {tr.product?.unit || "units"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {getStatusBadge(tr.status)}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-zinc-400 max-w-xs truncate">
                              {tr.notes || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedVisualizerTransfer(tr)}
                                  className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-xs h-7 px-2"
                                  title="View Transfer Route Visualizer"
                                >
                                  Visualizer
                                </Button>

                                {tr.status === "REQUESTED" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleDispatch(tr.id)}
                                      disabled={isActing}
                                      className="bg-zinc-950 hover:bg-black text-white shadow-xs text-xs h-7 px-2.5"
                                    >
                                      <Truck className="w-3 h-3 mr-1" />
                                      Dispatch
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancel(tr.id)}
                                      disabled={isActing}
                                      className="text-zinc-500 hover:text-black hover:bg-zinc-100 text-xs h-7 px-2"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}

                                {tr.status === "IN_TRANSIT" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleReceive(tr.id)}
                                      disabled={isActing}
                                      className="bg-zinc-950 hover:bg-black text-white shadow-xs text-xs h-7 px-2.5"
                                    >
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Receive
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancel(tr.id)}
                                      disabled={isActing}
                                      className="text-zinc-500 hover:text-black hover:bg-zinc-100 text-xs h-7 px-2"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}

                                {(tr.status === "RECEIVED" || tr.status === "CANCELLED") && (
                                  <span className="text-xs text-zinc-500 font-medium italic">
                                    Archived
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal: New Warehouse */}
        <Modal
          isOpen={warehouseModalOpen}
          onClose={() => setWarehouseModalOpen(false)}
          maxWidth="md"
          className="p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900 text-lg flex items-center gap-2">
              <WarehouseIcon className="w-5 h-5 text-zinc-900" />
              Add Storage Facility
            </h3>
            <button
              onClick={() => setWarehouseModalOpen(false)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {warehouseError && (
            <div className="mt-4 p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-950 font-medium">
              {warehouseError}
            </div>
          )}

          <form onSubmit={handleCreateWarehouse} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Warehouse Name *
              </label>
              <Input
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="e.g. West Coast Distribution Hub"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Facility Code (Unique) *
              </label>
              <Input
                value={warehouseCode}
                onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
                placeholder="e.g. WH-WEST-01"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Location / Address
              </label>
              <Input
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                placeholder="e.g. Port of Oakland, CA"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="whDefault"
                checked={warehouseIsDefault}
                onChange={(e) => setWarehouseIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-50 text-zinc-900 focus:ring-zinc-950"
              />
              <label htmlFor="whDefault" className="text-xs text-zinc-700 cursor-pointer">
                Set as default receiving facility for new inventory
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWarehouseModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={warehouseSubmitting}
                className="bg-zinc-950 hover:bg-black text-white shadow-xs"
              >
                {warehouseSubmitting ? "Creating..." : "Create Facility"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: New Transfer */}
        <Modal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          maxWidth="lg"
          className="p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900 text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-zinc-900" />
              Initiate Stock Transfer
            </h3>
            <button
              onClick={() => setTransferModalOpen(false)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {transferError && (
            <div className="mt-4 p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-950 font-medium">
              {transferError}
            </div>
          )}

          <form onSubmit={handleCreateTransfer} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Source Warehouse *
                </label>
                <select
                  value={sourceWarehouseId}
                  onChange={(e) => setSourceWarehouseId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  required
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Destination Warehouse *
                </label>
                <select
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  required
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Select Product *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.sku}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Quantity to Transfer *
              </label>
              <Input
                type="number"
                min="1"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Stock will be held and deducted from source warehouse upon Dispatch.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Routing Notes / Manifest
              </label>
              <Input
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="e.g. Urgent regional rebalancing"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTransferModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={transferSubmitting}
                className="bg-zinc-950 hover:bg-black text-white shadow-xs"
              >
                {transferSubmitting ? "Initiating..." : "Create Transfer Request"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Transfer Visualizer */}
        <Modal
          isOpen={!!selectedVisualizerTransfer}
          onClose={() => setSelectedVisualizerTransfer(null)}
          maxWidth="lg"
          className="p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900 text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-zinc-900" />
              Stock Transit Route Visualizer
            </h3>
            <button
              onClick={() => setSelectedVisualizerTransfer(null)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedVisualizerTransfer && (
            <div className="space-y-4 mt-4">
              <WarehouseTransferVisualizer transfer={selectedVisualizerTransfer} />
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVisualizerTransfer(null)}
                  className="border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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
