"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  Building2,
  Users,
  RefreshCw,
  X,
  Eye,
  Send,
  Warehouse as WarehouseIcon,
  PackagePlus,
  Boxes,
  Search,
} from "lucide-react";
import {
  fetchPurchaseOrders,
  createPurchaseOrderApi,
  issuePurchaseOrderApi,
  receivePurchaseOrderApi,
  cancelPurchaseOrderApi,
  fetchSuppliers,
  createSupplierApi,
  fetchProducts,
  fetchWarehouses,
} from "@/lib/api";
import { PurchaseOrder, Supplier, Product, Warehouse } from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { POLifecycleStepper } from "@/components/ui/POLifecycleStepper";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { useReducedMotion, createStaggerContainer, slideUpVariants } from "@/motion";

export default function PurchasingPage() {
  const { currentOrg } = useTenant();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
  const itemVariants = slideUpVariants(prefersReducedMotion);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [poIdToCancel, setPoIdToCancel] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create PO Modal State
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poWarehouseId, setPoWarehouseId] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poItems, setPoItems] = useState<
    { product_id: string; quantity: number; unit_cost: number }[]
  >([]);
  const [poError, setPoError] = useState("");
  const [poSubmitting, setPoSubmitting] = useState(false);

  // New Supplier Modal State
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supCompany, setSupCompany] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supTerms, setSupTerms] = useState("Net 30");
  const [supError, setSupError] = useState("");
  const [supSubmitting, setSupSubmitting] = useState(false);

  // PO Detail Modal State
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null);

  const loadData = async () => {
    if (purchaseOrders.length === 0) setLoading(true);
    try {
      const [posList, supList, prodList, whList] = await Promise.all([
        fetchPurchaseOrders(),
        fetchSuppliers(),
        fetchProducts(),
        fetchWarehouses(),
      ]);
      setPurchaseOrders(posList);
      setSuppliers(supList);
      setProducts(prodList);
      setWarehouses(whList);

      if (supList.length > 0 && !poSupplierId) {
        setPoSupplierId(supList[0].id);
      }
      if (whList.length > 0 && !poWarehouseId) {
        setPoWarehouseId(whList[0].id);
      }
    } catch (err) {
      console.error("Failed to load purchasing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg?.id]);

  const handleOpenCreatePO = () => {
    if (products.length === 0) {
      toast.warning("Catalog empty", "Please add products to catalog first before creating purchase orders.");
      return;
    }
    if (warehouses.length === 0) {
      toast.warning("No warehouse found", "Please add at least one warehouse before creating purchase orders.");
      return;
    }
    if (suppliers.length === 0) {
      setSupplierModalOpen(true);
      return;
    }

    setPoSupplierId(suppliers[0].id);
    setPoWarehouseId(warehouses[0].id);
    setPoNotes("");
    setPoItems([
      {
        product_id: products[0].id,
        quantity: 10,
        unit_cost: products[0].cost_price,
      },
    ]);
    setPoError("");
    setPoModalOpen(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setPoItems([
      ...poItems,
      {
        product_id: products[0].id,
        quantity: 10,
        unit_cost: products[0].cost_price,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (poItems.length <= 1) return;
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...poItems];
    if (field === "product_id") {
      const prod = products.find((p) => p.id === value);
      updated[index].product_id = value;
      if (prod) updated[index].unit_cost = prod.cost_price;
    } else if (field === "quantity") {
      updated[index].quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === "unit_cost") {
      updated[index].unit_cost = Math.max(0, parseFloat(value) || 0);
    }
    setPoItems(updated);
  };

  const poCalculatedTotal = poItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0
  );

  const handleCreatePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poWarehouseId) {
      setPoError("Please select both a supplier and a receiving warehouse.");
      return;
    }
    if (poItems.length === 0) {
      setPoError("Please add at least one line item.");
      return;
    }

    setPoSubmitting(true);
    setPoError("");
    try {
      await createPurchaseOrderApi({
        supplier_id: poSupplierId,
        destination_warehouse_id: poWarehouseId,
        notes: poNotes.trim() || undefined,
        items: poItems.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost),
        })),
      });
      setPoModalOpen(false);
      toast.success("Purchase order created", "PO registered in draft state.");
      await loadData();
    } catch (err: any) {
      setPoError(err.message || "Failed to create purchase order");
    } finally {
      setPoSubmitting(false);
    }
  };

  const handleCreateSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supEmail.trim()) {
      setSupError("Supplier name and email are required.");
      return;
    }
    setSupSubmitting(true);
    setSupError("");
    try {
      const newSup = await createSupplierApi({
        name: supName.trim(),
        email: supEmail.trim().toLowerCase(),
        phone: supPhone.trim() || undefined,
        company: supCompany.trim() || undefined,
        address: supAddress.trim() || undefined,
        payment_terms: supTerms || "Net 30",
      });
      toast.success("Supplier created", `${newSup.name} added to vendor directory.`);
      setSupplierModalOpen(false);
      setSupName("");
      setSupEmail("");
      setSupPhone("");
      setSupCompany("");
      setSupAddress("");
      setSupTerms("Net 30");
      await loadData();
      setPoSupplierId(newSup.id);
    } catch (err: any) {
      setSupError(err.message || "Failed to create supplier");
    } finally {
      setSupSubmitting(false);
    }
  };

  const handleIssuePO = async (poId: string) => {
    setActionLoading(poId);
    try {
      const updated = await issuePurchaseOrderApi(poId);
      if (detailPO?.id === poId) setDetailPO(updated);
      toast.success("PO issued", `Purchase order ${updated.po_number} issued to supplier.`);
      await loadData();
    } catch (err: any) {
      toast.error("Issue PO error", err.message || "Unable to issue PO");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReceivePO = async (poId: string) => {
    setActionLoading(poId);
    try {
      const updated = await receivePurchaseOrderApi(poId);
      if (detailPO?.id === poId) setDetailPO(updated);
      toast.success("Goods received", `Inventory updated for PO ${updated.po_number}.`);
      await loadData();
    } catch (err: any) {
      toast.error("Receiving error", err.message || "Unable to receive goods");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelPO = (poId: string) => {
    setPoIdToCancel(poId);
  };

  // KPIs
  const receivedPOs = purchaseOrders.filter((p) => p.status === "RECEIVED");
  const totalProcuredAmount = receivedPOs.reduce((sum, p) => sum + p.total_amount, 0);
  const activePOCount = purchaseOrders.filter((p) => p.status === "DRAFT" || p.status === "ISSUED").length;
  const issuedPOs = purchaseOrders.filter((p) => p.status === "ISSUED");
  const inboundUnits = issuedPOs.reduce(
    (sum, p) => sum + p.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );

  const filteredPOs = purchaseOrders.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = p.po_number.toLowerCase().includes(q);
      const matchSup = p.supplier?.name.toLowerCase().includes(q) || false;
      const matchCompany = p.supplier?.company?.toLowerCase().includes(q) || false;
      return matchNum || matchSup || matchCompany;
    }
    return true;
  });

  const getStatusBadge = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-700 border border-zinc-700">
            <Clock className="w-3 h-3" />
            DRAFT
          </span>
        );
      case "ISSUED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-300">
            <Send className="w-3 h-3" />
            ISSUED TO VENDOR
          </span>
        );
      case "RECEIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-900/10 text-zinc-900 border border-zinc-900/20">
            <CheckCircle2 className="w-3 h-3" />
            GOODS RECEIVED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-200 text-zinc-700 border border-zinc-300">
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
            <Truck className="w-6 h-6 text-zinc-900" />
            Suppliers & Purchasing
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Vendor purchase orders, inbound goods receiving, and warehouse restocking.
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
            onClick={() => setSupplierModalOpen(true)}
            className="border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <Building2 className="w-4 h-4 mr-1.5" />
            New Supplier
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreatePO}
            className="bg-zinc-950 hover:bg-black text-white shadow-xs shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Purchase Order
          </Button>
        </div>
      </motion.div>

      {/* KPI Metrics Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <Card className="">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-900/10 text-zinc-900 flex items-center justify-center border border-zinc-900/20">
              <span className="text-lg font-bold">₹</span>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Goods Procured</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={totalProcuredAmount} prefix="₹" formatINR decimals={2} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Active Purchase Orders</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={activePOCount} />
                </span>
                <span className="text-xs text-zinc-500">Draft + Issued</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Incoming Units</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={inboundUnits} />
                </span>
                <span className="text-xs text-zinc-700">In Transit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Active Suppliers</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={suppliers.length} />
                </span>
                <span className="text-xs text-zinc-500">Vendors</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

        {/* Purchase Orders Table Container */}
        <Card className="">
          <CardHeader className="border-b border-zinc-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by PO # or vendor..."
                  className="w-64 text-xs h-8 pl-8 pr-7"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-700 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs">
                {["ALL", "DRAFT", "ISSUED", "RECEIVED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      statusFilter === st
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-zinc-400">
              Showing <span className="font-semibold text-zinc-900">{filteredPOs.length}</span> purchase orders
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={5} columns={["w-28", "w-40", "w-32", "w-14", "w-28", "w-24", "w-24"]} />
                <SkeletonAnnouncer label="Loading purchase orders" />
              </div>
            ) : filteredPOs.length === 0 ? (
              <EmptyState
                compact
                icon={Truck}
                title="No purchase orders found"
                description="Create a purchase order to procure goods and replenish warehouse inventory."
                action={
                  <Button size="sm" variant="primary" onClick={() => setPoModalOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Create Purchase Order
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-700">
                  <thead className="bg-zinc-50 text-xs uppercase font-medium text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="py-3.5 px-4">PO Number</th>
                      <th className="py-3.5 px-4">Vendor / Supplier</th>
                      <th className="py-3.5 px-4">Receiving Warehouse</th>
                      <th className="py-3.5 px-4 text-center">Items</th>
                      <th className="py-3.5 px-4 text-right">PO Total</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredPOs.map((po) => {
                      const isActing = actionLoading === po.id;
                      const itemCount = po.items.reduce((acc, it) => acc + it.quantity, 0);

                      return (
                        <tr key={po.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-zinc-900">
                            {po.po_number}
                            <div className="text-[10px] font-normal text-zinc-500 mt-0.5">
                              {new Date(po.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-zinc-900">{po.supplier?.name || "Supplier"}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              {po.supplier?.company && (
                                <span className="font-medium text-zinc-600">
                                  {po.supplier.company}
                                </span>
                              )}
                              <span className="text-zinc-400 font-mono text-[11px]">
                                {po.supplier?.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-zinc-500">
                            <div>
                              <span className="text-zinc-700 font-medium">
                                {po.destination_warehouse?.name || "Acme Central DC"}
                              </span>
                              <span className="font-mono text-[10px] text-zinc-400 block">
                                {po.destination_warehouse?.code || "WH-MAIN"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-600">
                            {po.items.length} lines ({itemCount} units)
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                            ₹{po.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center">{getStatusBadge(po.status)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailPO(po)}
                                className="text-zinc-500 hover:text-zinc-900 text-xs h-7 px-2"
                                title="View Purchase Order"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Details
                              </Button>

                              {po.status === "DRAFT" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleIssuePO(po.id)}
                                    disabled={isActing}
                                    className="bg-zinc-950 hover:bg-black text-white shadow-xs text-xs h-7 px-2.5"
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    Issue PO
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelPO(po.id)}
                                    disabled={isActing}
                                    className="text-zinc-500 hover:text-black hover:bg-zinc-100 text-xs h-7 px-2"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {po.status === "ISSUED" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReceivePO(po.id)}
                                    disabled={isActing}
                                    className="bg-zinc-950 hover:bg-black text-white shadow-xs text-xs h-7 px-2.5"
                                  >
                                    <PackagePlus className="w-3 h-3 mr-1" />
                                    Receive Goods
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelPO(po.id)}
                                    disabled={isActing}
                                    className="text-zinc-500 hover:text-black hover:bg-zinc-100 text-xs h-7 px-2"
                                  >
                                    Cancel
                                  </Button>
                                </>
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

        {/* Modal: Create Purchase Order */}
        <Modal
          isOpen={poModalOpen}
          onClose={() => setPoModalOpen(false)}
          maxWidth="2xl"
          className="p-6 max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900 text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-zinc-900" />
              Create Purchase Order (PO)
            </h3>
            <button
              onClick={() => setPoModalOpen(false)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

              {poError && (
                <div className="mt-4 p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-950 font-medium">
                  {poError}
                </div>
              )}

              <form onSubmit={handleCreatePOSubmit} className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Vendor / Supplier *
                    </label>
                    <select
                      value={poSupplierId}
                      onChange={(e) => setPoSupplierId(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                      required
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.company ? `(${s.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Destination Warehouse *
                    </label>
                    <select
                      value={poWarehouseId}
                      onChange={(e) => setPoWarehouseId(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950"
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

                {/* Line Items Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Procurement Items
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItemRow}
                      className="border-zinc-700 text-xs h-7 text-zinc-700 hover:bg-zinc-800"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {poItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs"
                      >
                        <div className="flex-1">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                            className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} [{p.sku}]
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-20">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                            placeholder="Qty"
                            className="h-8 text-xs bg-white border-zinc-300 text-zinc-800"
                          />
                        </div>

                        <div className="w-24">
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-zinc-500 text-xs">₹</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_cost}
                              onChange={(e) => handleItemChange(idx, "unit_cost", e.target.value)}
                              placeholder="Cost"
                              className="h-8 text-xs bg-white border-zinc-300 pl-5 font-mono text-zinc-800"
                            />
                          </div>
                        </div>

                        <div className="w-24 text-right font-mono font-semibold text-zinc-900">
                          ₹{(item.quantity * item.unit_cost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={poItems.length <= 1}
                          className={`p-1.5 rounded transition-colors ${
                            poItems.length <= 1
                              ? "text-zinc-600 cursor-not-allowed"
                              : "text-zinc-400 hover:text-black hover:bg-zinc-100"
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* PO Total Preview */}
                  <div className="mt-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">Estimated PO Cost:</span>
                    <span className="text-base font-bold text-zinc-900 font-mono">
                      ₹{poCalculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Procurement Notes / Terms
                  </label>
                  <Input
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Standard 30-day billing invoice"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPoModalOpen(false)}
                    className="text-zinc-400 hover:text-zinc-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={poSubmitting}
                    className="bg-zinc-950 hover:bg-black text-white shadow-xs"
                  >
                    {poSubmitting ? "Generating PO..." : "Save Draft Purchase Order"}
                  </Button>
                </div>
              </form>
            </Modal>

        {/* Modal: New Supplier */}
        <Modal
          isOpen={supplierModalOpen}
          onClose={() => setSupplierModalOpen(false)}
          maxWidth="md"
          className="p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900 text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-zinc-700" />
              Register Vendor / Supplier
            </h3>
            <button
              onClick={() => setSupplierModalOpen(false)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {supError && (
            <div className="mt-4 p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-950 font-medium">
              {supError}
            </div>
          )}

          <form onSubmit={handleCreateSupplierSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Vendor Contact Name *
              </label>
              <Input
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                placeholder="e.g. Anand Mahindra"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Vendor Email *
              </label>
              <Input
                type="email"
                value={supEmail}
                onChange={(e) => setSupEmail(e.target.value)}
                placeholder="e.g. sales@vendor.in"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Company Name
                </label>
                <Input
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
                  placeholder="e.g. Mahindra Heavy Parts"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Phone Number
                </label>
                <Input
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="e.g. +91 98200 55443"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Registered Office / Plant Address
              </label>
              <Input
                value={supAddress}
                onChange={(e) => setSupAddress(e.target.value)}
                placeholder="e.g. Plant 4, MIDC Industrial Area, Pune"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Payment Terms
              </label>
              <select
                value={supTerms}
                onChange={(e) => setSupTerms(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSupplierModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={supSubmitting}
                className="bg-zinc-950 hover:bg-black text-white shadow-xs"
              >
                {supSubmitting ? "Registering..." : "Save Supplier"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: PO Details & Inbound Receiving */}
        <Modal
          isOpen={!!detailPO}
          onClose={() => setDetailPO(null)}
          maxWidth="2xl"
          className="p-6 max-h-[90vh] flex flex-col"
        >
          {detailPO && (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900/10 text-zinc-900 flex items-center justify-center border border-zinc-900/20">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-lg font-mono">
                      {detailPO.po_number}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Created on {new Date(detailPO.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(detailPO.status)}
                  <button
                    onClick={() => setDetailPO(null)}
                    className="text-zinc-400 hover:text-zinc-700 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
                {/* PO Lifecycle Stepper (Real backend state) */}
                <POLifecycleStepper
                  status={detailPO.status}
                  createdAt={detailPO.created_at}
                  updatedAt={detailPO.updated_at}
                />

                {/* Supplier & Receiving Warehouse Cards */}
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Vendor / Supplier</span>
                    <span className="font-semibold text-zinc-900">{detailPO.supplier?.name}</span>
                    {detailPO.supplier?.company && (
                      <span className="text-zinc-400 block">{detailPO.supplier.company}</span>
                    )}
                    <span className="text-zinc-400 font-mono block mt-0.5">
                      {detailPO.supplier?.email}
                    </span>
                    <span className="text-zinc-500 text-[11px] block mt-1">
                      Terms: {detailPO.supplier?.payment_terms || "Net 30"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Receiving Destination Depot</span>
                    <span className="font-semibold text-zinc-900">
                      {detailPO.destination_warehouse?.name || "Acme Central DC"}
                    </span>
                    <span className="text-zinc-500 font-mono block">
                      {detailPO.destination_warehouse?.code || "WH-MAIN"}
                    </span>
                    {detailPO.destination_warehouse?.location && (
                      <span className="text-zinc-400 block mt-1 truncate">
                        Location: {detailPO.destination_warehouse.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Procured Goods Breakdown ({detailPO.items.length})
                  </h4>
                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs text-zinc-700">
                      <thead className="bg-zinc-50 text-zinc-400 uppercase font-medium border-b border-zinc-100">
                        <tr>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Unit Cost (₹)</th>
                          <th className="py-2.5 px-3 text-right">Subtotal (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {detailPO.items.map((it) => (
                          <tr key={it.id}>
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-zinc-900 block">
                                {it.product?.name || "Product"}
                              </span>
                              <span className="font-mono text-[11px] text-zinc-500">
                                {it.product?.sku || "SKU"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-900">
                              {it.quantity} {it.product?.unit || "units"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-zinc-500">
                              ₹{it.unit_cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">
                              ₹{it.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-zinc-50 font-semibold border-t border-zinc-100">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 text-right text-zinc-400">
                            Total Procurement Value:
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-sm text-zinc-900">
                            ₹{detailPO.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* State Machine Status Card */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs space-y-1.5">
                  <div className="font-medium text-zinc-700 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-zinc-900" />
                    Inventory Restocking Impact:
                  </div>
                  {detailPO.status === "DRAFT" && (
                    <p className="text-zinc-400 text-[11px]">
                      This PO is currently in <strong>DRAFT</strong>. Click &quot;Issue PO&quot; to send it to the supplier.
                    </p>
                  )}
                  {detailPO.status === "ISSUED" && (
                    <p className="text-zinc-700 text-[11px]">
                      This PO has been <strong>ISSUED</strong> to the vendor. Awaiting shipment arrival at destination facility.
                      Click &quot;Receive Goods&quot; upon delivery to automatically append IN movements to the warehouse ledger.
                    </p>
                  )}
                  {detailPO.status === "RECEIVED" && (
                    <p className="text-zinc-900 text-[11px]">
                      Goods have been <strong>RECEIVED</strong>! Inventory records have been appended with positive IN changes.
                    </p>
                  )}
                  {detailPO.status === "CANCELLED" && (
                    <p className="text-zinc-400 text-[11px]">
                      This purchase order was <strong>CANCELLED</strong>. No inventory was touched.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailPO(null)}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {detailPO.status === "DRAFT" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelPO(detailPO.id)}
                        disabled={actionLoading === detailPO.id}
                        className="text-zinc-500 hover:text-black text-xs"
                      >
                        Cancel PO
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleIssuePO(detailPO.id)}
                        disabled={actionLoading === detailPO.id}
                        className="bg-zinc-950 hover:bg-black text-white shadow-xs text-xs"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        Issue PO to Vendor
                      </Button>
                    </>
                  )}

                  {detailPO.status === "ISSUED" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelPO(detailPO.id)}
                        disabled={actionLoading === detailPO.id}
                        className="text-zinc-500 hover:text-black text-xs"
                      >
                        Cancel PO
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReceivePO(detailPO.id)}
                        disabled={actionLoading === detailPO.id}
                        className="bg-zinc-950 hover:bg-black text-white shadow-xs text-xs"
                      >
                        <PackagePlus className="w-3.5 h-3.5 mr-1" />
                        Receive Goods & Restock
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </Modal>

        <ConfirmModal
          isOpen={!!poIdToCancel}
          onClose={() => setPoIdToCancel(null)}
          onConfirm={async () => {
            if (!poIdToCancel) return;
            setActionLoading(poIdToCancel);
            try {
              const updated = await cancelPurchaseOrderApi(poIdToCancel);
              if (detailPO?.id === poIdToCancel) setDetailPO(updated);
              setPoIdToCancel(null);
              toast.success("PO cancelled", `Purchase order ${updated.po_number} was cancelled.`);
              await loadData();
            } catch (err: any) {
              toast.error("Cancellation error", err.message || "Unable to cancel PO");
            } finally {
              setActionLoading(null);
            }
          }}
          title="Cancel Purchase Order"
          description="Are you sure you want to cancel this purchase order? This inbound procurement request will be marked cancelled."
          confirmText="Cancel PO"
          variant="danger"
        />
      </motion.div>
    
  );
}
