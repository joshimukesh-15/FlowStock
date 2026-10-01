import { useEffect, useState } from "react";
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
  X,
  Package,
  AlertCircle,
  Pencil,
  Gauge,
  Database,
} from "lucide-react";
import {
  fetchWarehouses,
  createWarehouseApi,
  updateWarehouseApi,
  fetchTransfers,
  createTransferApi,
  dispatchTransferApi,
  receiveTransferApi,
  cancelTransferApi,
  fetchProducts,
} from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { WarehouseTransferVisualizer } from "@/components/ui/WarehouseTransferVisualizer";
import { FormModal } from "@/components/ui/FormModal";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton, SkeletonAnnouncer, PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { Select } from "@/components/ui/Select";

import { Tabs } from "@/components/ui/Tabs";
import { AnimatedBadge } from "@/components/ui/AnimatedBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReducedMotion, slideUpVariants, pageEnterVariants } from "@/motion";

export default function WarehousesPage() {
    const { currentOrg } = useTenant();
    const { toast } = useToast();
    const prefersReducedMotion = useReducedMotion();
    const itemVariants = slideUpVariants(prefersReducedMotion);
    const [warehouses, setWarehouses] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedVisualizerTransfer, setSelectedVisualizerTransfer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [transferIdToCancel, setTransferIdToCancel] = useState(null);
    const [filterStatus, setFilterStatus] = useState("ALL");

    // New Warehouse Modal State
    const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [warehouseName, setWarehouseName] = useState("");
    const [warehouseCode, setWarehouseCode] = useState("");
    const [warehouseLocation, setWarehouseLocation] = useState("");
    const [warehouseCapacity, setWarehouseCapacity] = useState(2500);
    const [warehouseIsDefault, setWarehouseIsDefault] = useState(false);
    const [warehouseError, setWarehouseError] = useState("");
    const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);

    // Edit Warehouse Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [editName, setEditName] = useState("");
    const [editCode, setEditCode] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editCapacity, setEditCapacity] = useState(2500);
    const [editIsDefault, setEditIsDefault] = useState(false);
    const [editError, setEditError] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

    // New Transfer Modal State
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [sourceWarehouseId, setSourceWarehouseId] = useState("");
    const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [transferQuantity, setTransferQuantity] = useState(5);
    const [transferNotes, setTransferNotes] = useState("");
    const [transferError, setTransferError] = useState("");
    const [transferSubmitting, setTransferSubmitting] = useState(false);

    const loadData = async () => {
        if (warehouses.length === 0)
            setLoading(true);
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
            }
            else if (whList.length === 1) {
                setSourceWarehouseId(whList[0].id);
            }
            if (prList.length > 0) {
                setSelectedProductId(prList[0].id);
            }
        }
        catch (err) {
            console.error("Failed to load warehouse data:", err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentOrg?.id]);

    const handleOpenEdit = (wh) => {
        setEditingWarehouse(wh);
        setEditName(wh.name || "");
        setEditCode(wh.code || "");
        setEditLocation(wh.location || "");
        setEditCapacity(wh.capacity || 2500);
        setEditIsDefault(wh.is_default || false);
        setEditError("");
        setEditModalOpen(true);
    };

    const handleCreateWarehouse = async (e) => {
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
                capacity: Number(warehouseCapacity) || 2500,
                is_default: warehouseIsDefault,
            });
            setWarehouseModalOpen(false);
            setWarehouseName("");
            setWarehouseCode("");
            setWarehouseLocation("");
            setWarehouseCapacity(2500);
            setWarehouseIsDefault(false);
            toast.success("Warehouse added", "Facility successfully registered.");
            await loadData();
        }
        catch (err) {
            setWarehouseError(err.message || "Failed to create warehouse");
        }
        finally {
            setWarehouseSubmitting(false);
        }
    };

    const handleUpdateWarehouse = async (e) => {
        e.preventDefault();
        if (!editingWarehouse) return;
        if (!editName.trim() || !editCode.trim()) {
            setEditError("Warehouse name and code are required.");
            return;
        }
        setEditSubmitting(true);
        setEditError("");
        try {
            await updateWarehouseApi(editingWarehouse.id, {
                name: editName.trim(),
                code: editCode.trim(),
                location: editLocation.trim() || undefined,
                capacity: Number(editCapacity) || 2500,
                is_default: editIsDefault,
            });
            setEditModalOpen(false);
            setEditingWarehouse(null);
            toast.success("Facility updated", "Storage capacity & details recalibrated.");
            await loadData();
        } catch (err) {
            setEditError(err.message || "Failed to update warehouse");
        } finally {
            setEditSubmitting(false);
        }
    };
    const handleCreateTransfer = async (e) => {
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
            toast.success("Transfer initiated", "Stock transfer logged.");
            await loadData();
        }
        catch (err) {
            setTransferError(err.message || "Failed to create transfer");
        }
        finally {
            setTransferSubmitting(false);
        }
    };
    const handleDispatch = async (transferId) => {
        setActionLoading(transferId);
        try {
            await dispatchTransferApi(transferId);
            toast.success("Transfer dispatched", "Transit movement initiated.");
            await loadData();
        }
        catch (err) {
            toast.error("Dispatch failed", err.message || "Unknown error");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleReceive = async (transferId) => {
        setActionLoading(transferId);
        try {
            await receiveTransferApi(transferId);
            toast.success("Transfer received", "Destination facility stock replenished.");
            await loadData();
        }
        catch (err) {
            toast.error("Receive failed", err.message || "Unknown error");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleCancel = (transferId) => {
        setTransferIdToCancel(transferId);
    };
    const filteredTransfers = transfers.filter((t) => {
        if (filterStatus === "ALL")
            return true;
        return t.status === filterStatus;
    });
    const getStatusBadge = (status) => {
        switch (status) {
            case "REQUESTED":
                return (<AnimatedBadge statusKey={status} variant="default" icon={Clock}>
            REQUESTED
          </AnimatedBadge>);
            case "IN_TRANSIT":
                return (<AnimatedBadge statusKey={status} variant="warning" icon={Truck} pulse>
            IN TRANSIT
          </AnimatedBadge>);
            case "RECEIVED":
                return (<AnimatedBadge statusKey={status} variant="success" icon={CheckCircle2}>
            RECEIVED
          </AnimatedBadge>);
            case "CANCELLED":
                return (<AnimatedBadge statusKey={status} variant="danger" icon={Ban}>
            CANCELLED
          </AnimatedBadge>);
        }
    };

    const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacity || 2500), 0);
    const totalStock = warehouses.reduce((sum, w) => sum + (w.current_stock || 0), 0);
    const networkUtilization = totalCapacity > 0 ? ((totalStock / totalCapacity) * 100).toFixed(1) : "0.0";
    const totalAvailable = Math.max(0, totalCapacity - totalStock);

    if (loading && warehouses.length === 0) {
      return <PageSkeleton hasKpis={true} tableRows={5} />;
    }

    return (
      <motion.div className="space-y-6" initial="hidden" animate="visible" variants={pageEnterVariants(prefersReducedMotion)}>
        {/* Top Header */}
        <PageHeader title={<span className="flex items-center gap-2.5">
              <WarehouseIcon className="w-6 h-6 text-slate-900 dark:text-[#F4F5F7]"/>
              Warehouses & Stock Transfers
            </span>} subtitle="Multi-facility inventory nodes, physical stock routing, and inter-depot logistics." actions={<>
              <RefreshButton onClick={loadData} />
              <Button variant="outline" size="sm" onClick={() => setWarehouseModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5"/>
                New Warehouse
              </Button>
              <Button size="sm" onClick={() => setTransferModalOpen(true)} disabled={warehouses.length < 2}>
                <Truck className="w-4 h-4 mr-1.5"/>
                Transfer Stock
              </Button>
            </>}/>

        {/* Network Metrics Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            title="Active Facilities"
            value={warehouses.length}
            suffix=" nodes"
            icon={WarehouseIcon}
            subText="Operational logistics depots"
          />
          <StatCard
            title="Total Network Capacity"
            value={totalCapacity}
            suffix=" units"
            icon={Database}
            subText="Aggregate storage threshold"
          />
          <StatCard
            title="Stored Live Inventory"
            value={totalStock}
            suffix=" units"
            icon={Package}
            subText={`${totalAvailable.toLocaleString()} units free headroom`}
          />
          <StatCard
            title="Network Capacity Load"
            value={Number(networkUtilization)}
            suffix="%"
            decimals={1}
            icon={Gauge}
            progress={Number(networkUtilization)}
            badge={
              <Badge
                variant={Number(networkUtilization) >= 90 ? "danger" : Number(networkUtilization) >= 75 ? "warning" : "success"}
                className="text-[10px]"
              >
                {Number(networkUtilization) >= 90 ? "High Load" : Number(networkUtilization) >= 75 ? "Elevated" : "Optimal"}
              </Badge>
            }
          />
        </motion.div>

        {/* Warehouses Grid */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Storage Facilities ({warehouses.length})
          </h2>
          {warehouses.length < 2 && (<span className="text-xs text-slate-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5"/>
              Add at least 2 warehouses to initiate inter-depot transfers.
            </span>)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {warehouses.map((wh) => {
            const capacity = wh.capacity || 2500;
            const currentStock = wh.current_stock || 0;
            const pct = Number(
              wh.utilization_pct !== undefined
                ? wh.utilization_pct
                : capacity > 0
                ? ((currentStock / capacity) * 100).toFixed(1)
                : 0
            );
            const availableUnits = Math.max(0, capacity - currentStock);

            const isCritical = pct >= 90;
            const isHigh = pct >= 75 && pct < 90;

            const badgeStyle = isCritical
              ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30"
              : isHigh
              ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30"
              : "text-[#565449] dark:text-[#D8CFBC] bg-[#D8CFBC]/20 dark:bg-[#D8CFBC]/10 border-[#D8CFBC]/40 dark:border-[#D8CFBC]/30";

            const barFillColor = isCritical
              ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
              : isHigh
              ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              : "bg-[#565449] dark:bg-[#D8CFBC] shadow-[0_0_8px_rgba(216,207,188,0.35)]";

            const statusLabel = isCritical
              ? "Near Limit"
              : isHigh
              ? "High Load"
              : pct === 0
              ? "Available"
              : "Optimal";

            return (
              <Card key={wh.id} className="p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-[#565449] transition-colors group">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-[#F4F5F7] text-sm truncate">
                          {wh.name}
                        </h3>
                        {wh.is_default && (
                          <Badge variant="success" className="text-[10px] uppercase tracking-wide shrink-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                        {wh.code}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(wh)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2B2E25] transition-colors cursor-pointer"
                        title="Configure Facility & Capacity"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#191B15] flex items-center justify-center text-slate-600 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#33372B]">
                        <WarehouseIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Realistic Capacity Metrics & Visualization */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50/70 dark:bg-[#191B15] border border-slate-200/60 dark:border-[#2B2E25]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-600 dark:text-[#9BA3AF] flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        Storage Capacity
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {currentStock.toLocaleString()}{" "}
                        <span className="font-normal text-slate-400">/ {capacity.toLocaleString()} units</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-[#23261E] overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${barFillColor}`}
                        style={{ width: `${Math.min(100, Math.max(currentStock > 0 ? 3 : 0, pct))}%` }}
                      />
                    </div>

                    {/* Capacity Footer: Remaining Units & Status Pill */}
                    <div className="flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t border-slate-200/40 dark:border-white/5">
                      <span className="text-slate-500 dark:text-[#7C8189] font-mono">
                        {availableUnits.toLocaleString()} units free
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeStyle}`}>
                        {pct.toFixed(1)}% · {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-[#2B2E25] flex items-center justify-between text-xs text-slate-400 dark:text-[#7C8189]">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-[#7C8189] shrink-0" />
                    {wh.location || "General Logistics Zone"}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-[#7C8189] shrink-0">
                    {formatDate(wh.created_at)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>

        {/* Stock Transfers Table */}
        <motion.div variants={itemVariants}>
          <Card spotlight={true} className="shadow-2xs">
            <CardHeader className="border-b border-slate-100 dark:border-[#2B2E25] py-3 px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-[#F4F5F7] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-900 dark:text-[#F4F5F7]"/>
                  Inter-Warehouse Stock Transfers
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-[#9BA3AF] mt-0.5">
                  Lifecycle audit: REQUESTED → IN_TRANSIT → RECEIVED.
                </p>
              </div>

              {/* Filter Tabs with Sliding Indicator */}
              <Tabs tabs={["ALL", "REQUESTED", "IN_TRANSIT", "RECEIVED", "CANCELLED"]} activeTab={filterStatus} onChange={setFilterStatus} layoutId="warehouses-filter-tabs" variant="pill"/>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (<div className="p-4">
                <TableSkeleton rows={5} columns={["w-28", "w-40", "w-48", "w-16", "w-24", "w-32", "w-24"]}/>
                <SkeletonAnnouncer label="Loading stock transfers"/>
              </div>) : filteredTransfers.length === 0 ? (<EmptyState compact icon={Package} title="No transfers found" description={filterStatus !== "ALL"
                ? `No transfers with status ${filterStatus.replace("_", " ")}.`
                : "Create an inter-warehouse transfer to balance facility stock."}/>) : (<div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-[#CBD5E1]">
                    <thead className="bg-slate-50 dark:bg-[#191B15] text-[11px] uppercase font-medium text-slate-500 dark:text-[#9BA3AF] border-b border-slate-100 dark:border-[#33372B]">
                      <tr>
                        <th className="py-2.5 px-3.5">Transfer #</th>
                        <th className="py-2.5 px-3.5">Product</th>
                        <th className="py-2.5 px-3.5">Routing Path</th>
                        <th className="py-2.5 px-3.5 text-right">Quantity</th>
                        <th className="py-2.5 px-3.5 text-center">Status</th>
                        <th className="py-2.5 px-3.5">Notes</th>
                        <th className="py-2.5 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2B2E25]">
                      {filteredTransfers.map((tr) => {
                const isActing = actionLoading === tr.id;
                return (<tr key={tr.id} className="hover:bg-slate-50/70 dark:hover:bg-[#191B15]/50 transition-colors">
                            <td className="py-2.5 px-3.5 font-mono text-xs font-semibold text-slate-900 dark:text-[#F4F5F7]">
                              {tr.transfer_number}
                              <div className="text-[10px] font-normal text-slate-400 dark:text-[#7C8189] mt-0.5">
                                {formatDate(tr.created_at)}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="font-medium text-slate-900 dark:text-[#F4F5F7]">
                                {tr.product?.name || "Product"}
                              </div>
                              <span className="font-mono text-[11px] text-slate-400 dark:text-[#7C8189]">
                                {tr.product?.sku || "SKU-UNKNOWN"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <button type="button" onClick={() => setSelectedVisualizerTransfer(tr)} className="group flex items-center gap-1.5 text-xs text-left hover:text-black dark:hover:text-white transition-colors" title="Click to view transit visualizer">
                                <span className="font-medium text-slate-700 dark:text-[#CBD5E1] group-hover:text-slate-950 dark:group-hover:text-white underline decoration-zinc-300 dark:decoration-zinc-600 group-hover:decoration-zinc-900 dark:group-hover:decoration-white underline-offset-2">
                                  {tr.source_warehouse?.name || "Source WH"}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5"/>
                                <span className="font-medium text-slate-700 dark:text-[#CBD5E1] group-hover:text-slate-950 dark:group-hover:text-white underline decoration-zinc-300 dark:decoration-zinc-600 group-hover:decoration-zinc-900 dark:group-hover:decoration-white underline-offset-2">
                                  {tr.destination_warehouse?.name || "Dest WH"}
                                </span>
                              </button>
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900 dark:text-[#F4F5F7]">
                              {tr.quantity}{" "}
                              <span className="text-[11px] text-slate-400 dark:text-[#7C8189] font-normal">
                                {tr.product?.unit || "units"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              {getStatusBadge(tr.status)}
                            </td>
                            <td className="py-2.5 px-3.5 text-xs text-slate-400 dark:text-[#7C8189] max-w-xs truncate">
                              {tr.notes || "—"}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => setSelectedVisualizerTransfer(tr)}
                                  title="View Transfer Route Visualizer"
                                >
                                  Visualizer
                                </Button>

                                {tr.status === "REQUESTED" && (
                                  <>
                                    <Button
                                      variant="solid"
                                      size="xs"
                                      onClick={() => handleDispatch(tr.id)}
                                      disabled={isActing}
                                      title="Dispatch Transfer"
                                    >
                                      <Truck className="w-3.5 h-3.5" />
                                      Dispatch
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => handleCancel(tr.id)}
                                      disabled={isActing}
                                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                      title="Cancel Transfer"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}

                                {tr.status === "IN_TRANSIT" && (
                                  <>
                                    <Button
                                      variant="solid"
                                      size="xs"
                                      onClick={() => handleReceive(tr.id)}
                                      disabled={isActing}
                                      title="Receive Goods"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Receive
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => handleCancel(tr.id)}
                                      disabled={isActing}
                                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                      title="Cancel Transfer"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}

                                {(tr.status === "RECEIVED" || tr.status === "CANCELLED") && (
                                  <span className="text-xs text-slate-400 dark:text-[#7C8189] font-medium italic">
                                    Archived
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>);
                      })}
                    </tbody>
                  </table>
                </div>)}
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal: New Warehouse */}
        <FormModal
          isOpen={warehouseModalOpen}
          onClose={() => setWarehouseModalOpen(false)}
          title="Add Storage Facility"
          icon={WarehouseIcon}
          onSubmit={handleCreateWarehouse}
          isSubmitting={warehouseSubmitting}
          submitText="Create Facility"
          error={warehouseError}
          maxWidth="md"
        >
          <FormField label="Warehouse Name *">
            <Input
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
              placeholder="e.g. West Coast Distribution Hub"
              required
            />
          </FormField>

          <FormField label="Facility Code (Unique) *">
            <Input
              value={warehouseCode}
              onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
              placeholder="e.g. WH-WEST-01"
              required
            />
          </FormField>

          <FormField label="Location / Address">
            <Input
              value={warehouseLocation}
              onChange={(e) => setWarehouseLocation(e.target.value)}
              placeholder="e.g. Port of Oakland, CA"
            />
          </FormField>

          <FormField
            label="Storage Capacity (Units) *"
            hint="Maximum inventory unit threshold for this physical storage hub."
          >
            <Input
              type="number"
              min="1"
              step="50"
              value={warehouseCapacity}
              onChange={(e) => setWarehouseCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="e.g. 2500"
              required
            />
          </FormField>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="whDefault"
              checked={warehouseIsDefault}
              onChange={(e) => setWarehouseIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-[#191B15] text-slate-900 focus:ring-zinc-950"
            />
            <label htmlFor="whDefault" className="text-xs text-slate-700 dark:text-[#CBD5E1] cursor-pointer">
              Set as default receiving facility for new inventory
            </label>
          </div>
        </FormModal>

        {/* Modal: Edit Warehouse */}
        <FormModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Configure Storage Facility & Capacity"
          icon={Pencil}
          onSubmit={handleUpdateWarehouse}
          isSubmitting={editSubmitting}
          submitText="Save Configuration"
          error={editError}
          maxWidth="md"
        >
          <FormField label="Warehouse Name *">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. West Coast Distribution Hub"
              required
            />
          </FormField>

          <FormField label="Facility Code (Unique) *">
            <Input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              placeholder="e.g. WH-WEST-01"
              required
            />
          </FormField>

          <FormField label="Location / Address">
            <Input
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="e.g. Port of Oakland, CA"
            />
          </FormField>

          <FormField
            label="Storage Capacity (Units) *"
            hint="Adjusting capacity recalibrates real-time utilization telemetry across the network."
          >
            <Input
              type="number"
              min="1"
              step="50"
              value={editCapacity}
              onChange={(e) => setEditCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              required
            />
          </FormField>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editWhDefault"
              checked={editIsDefault}
              onChange={(e) => setEditIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-[#191B15] text-slate-900 focus:ring-zinc-950"
            />
            <label htmlFor="editWhDefault" className="text-xs text-slate-700 dark:text-[#CBD5E1] cursor-pointer">
              Set as primary default facility for receiving stock
            </label>
          </div>
        </FormModal>

        {/* Modal: New Transfer */}
        <FormModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          title="Initiate Stock Transfer"
          icon={Truck}
          onSubmit={handleCreateTransfer}
          isSubmitting={transferSubmitting}
          submitText="Create Transfer Request"
          error={transferError}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Source Warehouse *">
              <Select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                placeholder="Choose source warehouse..."
                options={warehouses.map((wh) => ({
                  value: wh.id,
                  label: `${wh.name} (${wh.code})`,
                }))}
              />
            </FormField>

            <FormField label="Destination Warehouse *">
              <Select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(e.target.value)}
                placeholder="Choose destination warehouse..."
                options={warehouses.map((wh) => ({
                  value: wh.id,
                  label: `${wh.name} (${wh.code})`,
                }))}
              />
            </FormField>
          </div>

          <FormField label="Select Product *">
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              placeholder="Choose product to transfer..."
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} [${p.sku}]`,
              }))}
            />
          </FormField>

          <FormField
            label="Quantity to Transfer *"
            hint="Stock will be held and deducted from source warehouse upon Dispatch."
          >
            <Input
              type="number"
              min="1"
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </FormField>

          <FormField label="Routing Notes / Manifest">
            <Input
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="e.g. Urgent regional rebalancing"
            />
          </FormField>
        </FormModal>

        {/* Modal: Transfer Visualizer */}
        <Modal isOpen={!!selectedVisualizerTransfer} onClose={() => setSelectedVisualizerTransfer(null)} maxWidth="2xl" className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#22242B]">
            <h3 className="font-semibold text-slate-900 dark:text-[#FFFBF4] text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-900 dark:text-[#D8CFBC]"/>
              Stock Transit Route Visualizer
            </h3>
            <motion.button
              type="button"
              whileTap={{ scale: 0.90 }}
              onClick={() => setSelectedVisualizerTransfer(null)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#23261E] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#D8CFBC]"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5"/>
            </motion.button>
          </div>

          {selectedVisualizerTransfer && (<div className="space-y-4 mt-4">
              <WarehouseTransferVisualizer transfer={selectedVisualizerTransfer}/>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedVisualizerTransfer(null)}>
                  Close
                </Button>
              </div>
            </div>)}
        </Modal>

        <ConfirmModal isOpen={!!transferIdToCancel} onClose={() => setTransferIdToCancel(null)} onConfirm={async () => {
            if (!transferIdToCancel)
                return;
            setActionLoading(transferIdToCancel);
            try {
                await cancelTransferApi(transferIdToCancel);
                setTransferIdToCancel(null);
                toast.success("Transfer cancelled", "Stock transfer marked as cancelled.");
                await loadData();
            }
            catch (err) {
                toast.error("Cancel failed", err.message || "Unknown error");
            }
            finally {
                setActionLoading(null);
            }
        }} title="Cancel Stock Transfer" description="Are you sure you want to cancel this stock transfer? The transfer between facilities will be terminated and marked cancelled." confirmText="Cancel Transfer" variant="danger"/>
      </motion.div>);
}
