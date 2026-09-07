"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  PackageCheck,
  Building2,
  Users,
  DollarSign,
  RefreshCw,
  X,
  Eye,
  AlertCircle,
  Truck,
  Layers,
  Search,
} from "lucide-react";
import {
  fetchOrders,
  createOrderApi,
  confirmOrderApi,
  fulfillOrderApi,
  cancelOrderApi,
  fetchCustomers,
  createCustomerApi,
  fetchProducts,
  fetchWarehouses,
} from "@/lib/api";
import { SalesOrder, Customer, Product, Warehouse } from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { OrderLifecycleStepper } from "@/components/ui/OrderLifecycleStepper";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { AnimatedBadge } from "@/components/ui/AnimatedBadge";
import { motion } from "framer-motion";
import { useReducedMotion, createStaggerContainer, slideUpVariants } from "@/motion";

export default function OrdersPage() {
  const { currentOrg } = useTenant();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = createStaggerContainer(0.05, 0, prefersReducedMotion);
  const itemVariants = slideUpVariants(prefersReducedMotion);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [orderIdToCancel, setOrderIdToCancel] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Order Modal State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderCustomerId, setOrderCustomerId] = useState("");
  const [orderWarehouseId, setOrderWarehouseId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderItems, setOrderItems] = useState<
    { product_id: string; quantity: number; unit_price: number }[]
  >([]);
  const [orderError, setOrderError] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // New Customer Modal State
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custCompany, setCustCompany] = useState("");
  const [custBilling, setCustBilling] = useState("");
  const [custShipping, setCustShipping] = useState("");
  const [custError, setCustError] = useState("");
  const [custSubmitting, setCustSubmitting] = useState(false);

  // Order Details Modal State
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);

  const loadData = async () => {
    if (orders.length === 0) setLoading(true);
    try {
      const [ordList, custList, prodList, whList] = await Promise.all([
        fetchOrders(),
        fetchCustomers(),
        fetchProducts(),
        fetchWarehouses(),
      ]);
      setOrders(ordList);
      setCustomers(custList);
      setProducts(prodList);
      setWarehouses(whList);

      if (custList.length > 0 && !orderCustomerId) {
        setOrderCustomerId(custList[0].id);
      }
      if (whList.length > 0 && !orderWarehouseId) {
        setOrderWarehouseId(whList[0].id);
      }
    } catch (err) {
      console.error("Failed to load orders data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrg?.id]);

  const handleOpenCreateOrder = () => {
    if (products.length === 0) {
      toast.warning("No products available", "Please add products to catalog first before creating sales orders.");
      return;
    }
    if (customers.length === 0) {
      setCustomerModalOpen(true);
      return;
    }

    setOrderCustomerId(customers[0].id);
    if (warehouses.length > 0) setOrderWarehouseId(warehouses[0].id);
    setOrderNotes("");
    setOrderItems([
      {
        product_id: products[0].id,
        quantity: 1,
        unit_price: products[0].price,
      },
    ]);
    setOrderError("");
    setOrderModalOpen(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setOrderItems([
      ...orderItems,
      {
        product_id: products[0].id,
        quantity: 1,
        unit_price: products[0].price,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    if (field === "product_id") {
      const prod = products.find((p) => p.id === value);
      updated[index].product_id = value;
      if (prod) updated[index].unit_price = prod.price;
    } else if (field === "quantity") {
      updated[index].quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === "unit_price") {
      updated[index].unit_price = Math.max(0, parseFloat(value) || 0);
    }
    setOrderItems(updated);
  };

  const orderCalculatedTotal = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCustomerId) {
      setOrderError("Please select a customer.");
      return;
    }
    if (orderItems.length === 0) {
      setOrderError("Please add at least one line item.");
      return;
    }

    setOrderSubmitting(true);
    setOrderError("");
    try {
      await createOrderApi({
        customer_id: orderCustomerId,
        warehouse_id: orderWarehouseId || undefined,
        notes: orderNotes.trim() || undefined,
        items: orderItems.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      });
      setOrderModalOpen(false);
      toast.success("Sales order created", "Order has been registered in draft state.");
      await loadData();
    } catch (err: any) {
      setOrderError(err.message || "Failed to create sales order");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custEmail.trim()) {
      setCustError("Customer name and email are required.");
      return;
    }
    setCustSubmitting(true);
    setCustError("");
    try {
      const newCust = await createCustomerApi({
        name: custName.trim(),
        email: custEmail.trim().toLowerCase(),
        phone: custPhone.trim() || undefined,
        company: custCompany.trim() || undefined,
        billing_address: custBilling.trim() || undefined,
        shipping_address: custShipping.trim() || undefined,
      });
      toast.success("Customer created", `${newCust.name} added.`);
      setCustomerModalOpen(false);
      setCustName("");
      setCustEmail("");
      setCustPhone("");
      setCustCompany("");
      setCustBilling("");
      setCustShipping("");
      await loadData();
      setOrderCustomerId(newCust.id);
    } catch (err: any) {
      setCustError(err.message || "Failed to create customer");
    } finally {
      setCustSubmitting(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const updated = await confirmOrderApi(orderId);
      if (detailOrder?.id === orderId) setDetailOrder(updated);
      toast.success("Order confirmed", `Stock reserved for ${updated.order_number}.`);
      await loadData();
    } catch (err: any) {
      toast.error("Stock reservation error", err.message || "Unable to confirm order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFulfillOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const updated = await fulfillOrderApi(orderId);
      if (detailOrder?.id === orderId) setDetailOrder(updated);
      toast.success("Order fulfilled", `${updated.order_number} marked as fulfilled.`);
      await loadData();
    } catch (err: any) {
      toast.error("Fulfillment error", err.message || "Unable to fulfill order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderIdToCancel(orderId);
  };

  // KPIs
  const fulfilledOrders = orders.filter((o) => o.status === "FULFILLED");
  const totalRevenue = fulfilledOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingCount = orders.filter((o) => o.status === "DRAFT" || o.status === "CONFIRMED").length;
  const reservedOrders = orders.filter((o) => o.status === "CONFIRMED");
  const totalReservedUnits = reservedOrders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.order_number.toLowerCase().includes(q);
      const matchCust = o.customer?.name.toLowerCase().includes(q) || false;
      const matchCompany = o.customer?.company?.toLowerCase().includes(q) || false;
      return matchNum || matchCust || matchCompany;
    }
    return true;
  });

  const getStatusBadge = (status: SalesOrder["status"]) => {
    switch (status) {
      case "DRAFT":
        return (
          <AnimatedBadge statusKey={status} variant="default" icon={Clock}>
            DRAFT
          </AnimatedBadge>
        );
      case "CONFIRMED":
        return (
          <AnimatedBadge statusKey={status} variant="warning" icon={PackageCheck} pulse>
            STOCK RESERVED
          </AnimatedBadge>
        );
      case "FULFILLED":
        return (
          <AnimatedBadge statusKey={status} variant="success" icon={CheckCircle2}>
            FULFILLED
          </AnimatedBadge>
        );
      case "CANCELLED":
        return (
          <AnimatedBadge statusKey={status} variant="danger" icon={Ban}>
            CANCELLED
          </AnimatedBadge>
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
            <ShoppingCart className="w-6 h-6 text-zinc-900" />
            Sales Orders & Stock Allocation
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            B2B customer order lifecycle, inventory reservation, and dispatch fulfillment.
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
            onClick={() => setCustomerModalOpen(true)}
            className="border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <Users className="w-4 h-4 mr-1.5" />
            New Customer
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreateOrder}
            className="bg-zinc-950 hover:bg-black text-white shadow-xs shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Sales Order
          </Button>
        </div>
      </motion.div>

      {/* KPI Summary Cards */}
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
              <p className="text-xs font-medium text-zinc-500">Total Fulfilled Revenue</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={totalRevenue} prefix="₹" formatINR decimals={2} />
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
              <p className="text-xs font-medium text-zinc-500">Pending Orders</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={pendingCount} />
                </span>
                <span className="text-xs text-zinc-500">Draft + Confirmed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Reserved Stock Units</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={totalReservedUnits} />
                </span>
                <span className="text-xs text-zinc-700">Allocated</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Active B2B Customers</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-zinc-900 font-mono">
                  <AnimatedCounter value={customers.length} />
                </span>
                <span className="text-xs text-zinc-500">Profiles</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

        {/* Orders Table Container */}
        <Card className="">
          <CardHeader className="border-b border-zinc-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order # or customer..."
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

              {/* Status Filter Tabs with Sliding Indicator */}
              <Tabs
                tabs={["ALL", "DRAFT", "CONFIRMED", "FULFILLED", "CANCELLED"]}
                activeTab={statusFilter}
                onChange={setStatusFilter}
                layoutId="orders-status-tabs"
                variant="pill"
              />
            </div>

            <div className="text-xs text-zinc-500">
              Showing <span className="font-semibold text-zinc-900">{filteredOrders.length}</span> orders
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={6} columns={["w-28", "w-40", "w-28", "w-12", "w-28", "w-24", "w-24"]} />
                <SkeletonAnnouncer label="Loading sales orders" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState
                compact
                icon={ShoppingCart}
                title="No sales orders found"
                description="Create a sales order to reserve and fulfill stock for your customers."
                action={
                  <Button size="sm" variant="primary" onClick={() => setOrderModalOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Create Sales Order
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-700">
                  <thead className="bg-zinc-50 text-xs uppercase font-medium text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="py-3.5 px-4">Order #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Warehouse</th>
                      <th className="py-3.5 px-4 text-center">Items</th>
                      <th className="py-3.5 px-4 text-right">Order Value</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrders.map((o) => {
                      const isActing = actionLoading === o.id;
                      const itemCount = o.items.reduce((acc, it) => acc + it.quantity, 0);

                      return (
                        <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-zinc-900">
                            {o.order_number}
                            <div className="text-[10px] font-normal text-zinc-500 mt-0.5">
                              {new Date(o.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-zinc-900">{o.customer?.name || "Customer"}</div>
                            <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              {o.customer?.company && (
                                <span className="font-medium text-zinc-700">
                                  {o.customer.company}
                                </span>
                              )}
                              <span className="text-zinc-500 font-mono text-[11px]">
                                {o.customer?.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-zinc-400">
                            {o.warehouse ? (
                              <div>
                                <span className="text-zinc-700">{o.warehouse.name}</span>
                                <span className="font-mono text-[10px] text-zinc-500 block">
                                  {o.warehouse.code}
                                </span>
                              </div>
                            ) : (
                              "Default Facility"
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-700">
                            {o.items.length} lines ({itemCount} units)
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                            ₹{o.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center">{getStatusBadge(o.status)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailOrder(o)}
                                className="text-zinc-500 hover:text-zinc-900 text-xs h-7 px-2"
                                title="View Order Details"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Details
                              </Button>

                              {o.status === "DRAFT" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmOrder(o.id)}
                                    disabled={isActing}
                                    className="bg-zinc-900 hover:bg-black text-white text-xs h-7 px-2.5 font-medium shadow-xs"
                                  >
                                    <PackageCheck className="w-3 h-3 mr-1" />
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelOrder(o.id)}
                                    disabled={isActing}
                                    className="text-zinc-500 hover:text-black hover:bg-zinc-100 text-xs h-7 px-2"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {o.status === "CONFIRMED" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleFulfillOrder(o.id)}
                                    disabled={isActing}
                                    className="bg-zinc-950 hover:bg-black text-white shadow-xs text-xs h-7 px-2.5"
                                  >
                                    <Truck className="w-3 h-3 mr-1" />
                                    Fulfill
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelOrder(o.id)}
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

        {/* Modal: Create Sales Order */}
        <Modal isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} maxWidth="2xl" className="p-6 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900 text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-zinc-900" />
              Create Sales Order
            </h3>
            <button
              onClick={() => setOrderModalOpen(false)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {orderError && (
            <div className="mt-4 p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-950 font-medium">
              {orderError}
            </div>
          )}

          <form onSubmit={handleCreateOrderSubmit} className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  B2B Customer *
                </label>
                <select
                  value={orderCustomerId}
                  onChange={(e) => setOrderCustomerId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Fulfillment Facility
                </label>
                <select
                  value={orderWarehouseId}
                  onChange={(e) => setOrderWarehouseId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950"
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
                  Order Line Items
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
                {orderItems.map((item, idx) => (
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
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                          placeholder="Price"
                          className="h-8 text-xs bg-white border-zinc-300 pl-5 font-mono text-zinc-800"
                        />
                      </div>
                    </div>

                    <div className="w-24 text-right font-mono font-semibold text-zinc-900">
                      ₹{(item.quantity * item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={orderItems.length <= 1}
                      className={`p-1.5 rounded transition-colors ${
                        orderItems.length <= 1
                          ? "text-zinc-600 cursor-not-allowed"
                          : "text-zinc-400 hover:text-black hover:bg-zinc-200"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between p-3 mt-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-xs text-zinc-500">
                  Total Order Amount ({orderItems.length} items):
                </span>
                <span className="text-base font-bold font-mono text-zinc-950">
                  ₹{orderCalculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Order Notes / Reference
              </label>
              <Input
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. PO-REF-2024-88, delivery instructions"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOrderModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={orderSubmitting}
                className="bg-zinc-950 hover:bg-black text-white shadow-xs"
              >
                {orderSubmitting ? "Creating Order..." : "Create Draft Order"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: New Customer */}
        <Modal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} maxWidth="md" className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900 text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-zinc-700" />
              Add B2B Customer Profile
            </h3>
            <button
              onClick={() => setCustomerModalOpen(false)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {custError && (
            <div className="mt-4 p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-950 font-medium">
              {custError}
            </div>
          )}

          <form onSubmit={handleCreateCustomerSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Contact Name *
              </label>
              <Input
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="e.g. procurement@bharatcorp.in"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Company / Organization
                </label>
                <Input
                  value={custCompany}
                  onChange={(e) => setCustCompany(e.target.value)}
                  placeholder="e.g. Bharat Corp Ltd"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Phone Number
                </label>
                <Input
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="e.g. +91 98200 12345"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Shipping Address
              </label>
              <Input
                value={custShipping}
                onChange={(e) => setCustShipping(e.target.value)}
                placeholder="e.g. Warehouse 4B, MIDC Industrial Area, Pune"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCustomerModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={custSubmitting}
                className="bg-zinc-950 hover:bg-black text-white shadow-xs"
              >
                {custSubmitting ? "Adding..." : "Save Customer"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Order Details & Status Workflow */}
        <Modal
          isOpen={!!detailOrder}
          onClose={() => setDetailOrder(null)}
          maxWidth="2xl"
          className="p-6 max-h-[90vh] flex flex-col"
        >
          {detailOrder && (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900/10 text-zinc-900 flex items-center justify-center border border-zinc-900/20">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-lg font-mono">
                      {detailOrder.order_number}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Created on {new Date(detailOrder.created_at).toLocaleDateString()} &bull; {detailOrder.customer?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(detailOrder.status)}
                  <button
                    onClick={() => setDetailOrder(null)}
                    className="text-zinc-400 hover:text-zinc-700 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Order Lifecycle Stepper (Real backend state) */}
                <OrderLifecycleStepper
                  status={detailOrder.status}
                  createdAt={detailOrder.created_at}
                  updatedAt={detailOrder.updated_at}
                />

                {/* Customer Info Card */}
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Customer</span>
                    <span className="font-semibold text-zinc-900">{detailOrder.customer?.name}</span>
                    {detailOrder.customer?.company && (
                      <span className="text-zinc-500 block">{detailOrder.customer.company}</span>
                    )}
                    <span className="text-zinc-500 font-mono block mt-0.5">
                      {detailOrder.customer?.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Fulfillment Facility</span>
                    <span className="font-semibold text-zinc-900">
                      {detailOrder.warehouse?.name || "Acme Central DC"}
                    </span>
                    <span className="text-zinc-500 font-mono block">
                      {detailOrder.warehouse?.code || "WH-MAIN"}
                    </span>
                    {detailOrder.customer?.shipping_address && (
                      <span className="text-zinc-600 block mt-1 truncate">
                        Ship To: {detailOrder.customer.shipping_address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Itemized Order Lines ({detailOrder.items?.length || 0})
                  </h4>
                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs text-zinc-700">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase font-medium border-b border-zinc-200">
                        <tr>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right">Subtotal (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {detailOrder.items?.map((it) => (
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
                              ₹{it.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">
                              ₹{it.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-zinc-50 font-semibold border-t border-zinc-200">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 text-right text-zinc-500">
                            Total Order Value:
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-sm text-zinc-950 font-bold">
                            ₹{detailOrder.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* State Machine Explainer Card */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs space-y-1.5">
                  <div className="font-medium text-zinc-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-900" />
                    Inventory Reservation Status:
                  </div>
                  {detailOrder.status === "DRAFT" && (
                    <p className="text-zinc-400 text-[11px]">
                      This order is currently a <strong>DRAFT</strong>. Stock has not yet been reserved.
                      Clicking &quot;Confirm & Reserve&quot; checks available inventory and allocates it.
                    </p>
                  )}
                  {detailOrder.status === "CONFIRMED" && (
                    <p className="text-zinc-700 text-[11px]">
                      This order is <strong>CONFIRMED</strong>. Stock is safely reserved in the warehouse and cannot be sold to other orders.
                      Clicking &quot;Fulfill & Dispatch&quot; appends OUT ledger entries and reduces on-hand inventory.
                    </p>
                  )}
                  {detailOrder.status === "FULFILLED" && (
                    <p className="text-zinc-900 text-[11px]">
                      This order is <strong>FULFILLED</strong>. Goods have been dispatched from the warehouse and corresponding ledger entries were recorded.
                    </p>
                  )}
                  {detailOrder.status === "CANCELLED" && (
                    <p className="text-zinc-400 text-[11px]">
                      This order is <strong>CANCELLED</strong>. Any reserved inventory was returned to the available selling pool.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailOrder(null)}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {detailOrder.status === "DRAFT" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(detailOrder.id)}
                        disabled={actionLoading === detailOrder.id}
                        className="text-zinc-500 hover:text-black text-xs"
                      >
                        Cancel Order
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmOrder(detailOrder.id)}
                        disabled={actionLoading === detailOrder.id}
                        className="bg-zinc-950 hover:bg-black text-white text-xs font-medium shadow-xs"
                      >
                        <PackageCheck className="w-3.5 h-3.5 mr-1" />
                        Confirm & Reserve Stock
                      </Button>
                    </>
                  )}

                  {detailOrder.status === "CONFIRMED" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(detailOrder.id)}
                        disabled={actionLoading === detailOrder.id}
                        className="text-zinc-500 hover:text-black text-xs"
                      >
                        Cancel Order
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleFulfillOrder(detailOrder.id)}
                        disabled={actionLoading === detailOrder.id}
                        className="bg-zinc-950 hover:bg-black text-white shadow-xs text-xs"
                      >
                        <Truck className="w-3.5 h-3.5 mr-1" />
                        Fulfill & Dispatch
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </Modal>

        <ConfirmModal
          isOpen={!!orderIdToCancel}
          onClose={() => setOrderIdToCancel(null)}
          onConfirm={async () => {
            if (!orderIdToCancel) return;
            setActionLoading(orderIdToCancel);
            try {
              const updated = await cancelOrderApi(orderIdToCancel);
              if (detailOrder?.id === orderIdToCancel) setDetailOrder(updated);
              setOrderIdToCancel(null);
              toast.success("Order cancelled", `Order ${updated.order_number} has been cancelled.`);
              await loadData();
            } catch (err: any) {
              toast.error("Cancellation error", err.message || "Unable to cancel order");
            } finally {
              setActionLoading(null);
            }
          }}
          title="Cancel Sales Order"
          description="Are you sure you want to cancel this order? Any reserved inventory will be automatically released back to available stock."
          confirmText="Cancel Order"
          variant="danger"
        />
      </motion.div>
    
  );
}
