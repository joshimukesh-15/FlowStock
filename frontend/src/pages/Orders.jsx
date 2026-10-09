"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShoppingCart, Plus, Trash2, Clock, PackageCheck, Users, X, Eye, Truck, Building2, Layers, IndianRupee } from "lucide-react";
import { fulfillOrderApi, cancelOrderApi, createCustomerApi } from "@/lib/api";
import { useOrdersData } from "@/hooks/useFlowStockData";
import { useToast } from "@/context/ToastContext";
import { OrderLifecycleStepper } from "@/components/ui/OrderLifecycleStepper";
import { Modal } from "@/components/ui/Modal";
import { FormModal } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";
import { KpiGrid } from "@/components/ui/KpiGrid";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton, PageSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { formatDate } from "@/lib/utils";
import { Select } from "@/components/ui/Select";
import { motion } from "framer-motion";
import { useReducedMotion, pageEnterVariants } from "@/motion";
import { usePermissions } from "@/hooks/usePermissions";

export default function OrdersPage() {
    const { toast } = useToast();
    const { can, isReadOnly } = usePermissions();
    const prefersReducedMotion = useReducedMotion();
    const [actionLoading, setActionLoading] = useState(null);
    const [orderIdToCancel, setOrderIdToCancel] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // SWR & Optimistic UI for Orders & Sales (0ms Navigation + Instant Status Updates)
    const {
        orders,
        customers,
        warehouses,
        products,
        isLoading: loading,
        confirmOrder,
        createOrder,
        mutate,
    } = useOrdersData({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
    });

    // Create Order Modal State
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [orderCustomerId, setOrderCustomerId] = useState("");
    const [orderWarehouseId, setOrderWarehouseId] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const [orderItems, setOrderItems] = useState([]);
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
    const [detailOrder, setDetailOrder] = useState(null);

    useEffect(() => {
        if (customers.length > 0 && !orderCustomerId) {
            setOrderCustomerId(customers[0].id);
        }
        if (warehouses.length > 0 && !orderWarehouseId) {
            setOrderWarehouseId(warehouses[0].id);
        }
    }, [customers, warehouses]);
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
        if (warehouses.length > 0)
            setOrderWarehouseId(warehouses[0].id);
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
        if (products.length === 0)
            return;
        setOrderItems([
            ...orderItems,
            {
                product_id: products[0].id,
                quantity: 1,
                unit_price: products[0].price,
            },
        ]);
    };
    const handleRemoveItemRow = (index) => {
        if (orderItems.length <= 1)
            return;
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };
    const handleItemChange = (index, field, value) => {
        const updated = [...orderItems];
        if (field === "product_id") {
            const prod = products.find((p) => p.id === value);
            updated[index].product_id = value;
            if (prod)
                updated[index].unit_price = prod.price;
        }
        else if (field === "quantity") {
            updated[index].quantity = Math.max(1, parseInt(value) || 1);
        }
        else if (field === "unit_price") {
            updated[index].unit_price = Math.max(0, parseFloat(value) || 0);
        }
        setOrderItems(updated);
    };
    const orderCalculatedTotal = orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const handleCreateOrderSubmit = async (e) => {
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
            await createOrder({
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
        }
        catch (err) {
            setOrderError(err.message || "Failed to create sales order");
        }
        finally {
            setOrderSubmitting(false);
        }
    };
    const handleCreateCustomerSubmit = async (e) => {
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
            await mutate();
            setOrderCustomerId(newCust.id);
        }
        catch (err) {
            setCustError(err.message || "Failed to create customer");
        }
        finally {
            setCustSubmitting(false);
        }
    };
    const handleConfirmOrder = async (orderId) => {
        setActionLoading(orderId);
        try {
            const updated = await confirmOrder(orderId);
            if (detailOrder?.id === orderId)
                setDetailOrder(updated || ((prev) => prev ? { ...prev, status: "CONFIRMED" } : prev));
            toast.success("Order confirmed", "Stock reserved for order.");
        }
        catch (err) {
            toast.error("Stock reservation error", err.message || "Unable to confirm order");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleFulfillOrder = async (orderId) => {
        setActionLoading(orderId);
        try {
            const updated = await fulfillOrderApi(orderId);
            if (detailOrder?.id === orderId)
                setDetailOrder(updated);
            toast.success("Order fulfilled", `${updated?.order_number || "Order"} marked as fulfilled.`);
            await mutate();
        }
        catch (err) {
            toast.error("Fulfillment error", err.message || "Unable to fulfill order");
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleCancelOrder = (orderId) => {
        setOrderIdToCancel(orderId);
    };
    // KPIs
    const safeOrders = Array.isArray(orders) ? orders : [];
    const fulfilledOrders = safeOrders.filter((o) => o?.status === "FULFILLED");
    const totalRevenue = fulfilledOrders.reduce((sum, o) => sum + (Number(o?.total_amount) || 0), 0);
    const pendingCount = safeOrders.filter((o) => o?.status === "DRAFT" || o?.status === "CONFIRMED").length;
    const reservedOrders = safeOrders.filter((o) => o?.status === "CONFIRMED");
    const totalReservedUnits = reservedOrders.reduce((sum, o) => sum + (Array.isArray(o?.items) ? o.items.reduce((iSum, it) => iSum + (Number(it?.quantity) || 0), 0) : 0), 0);
    const filteredOrders = safeOrders.filter((o) => {
        if (!o) return false;
        if (statusFilter !== "ALL" && o.status !== statusFilter)
            return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchNum = o.order_number?.toLowerCase().includes(q) || false;
            const matchCust = o.customer?.name?.toLowerCase().includes(q) || false;
            const matchCompany = o.customer?.company?.toLowerCase().includes(q) || false;
            return matchNum || matchCust || matchCompany;
        }
        return true;
    });
    if (loading && safeOrders.length === 0) {
      return <PageSkeleton hasKpis={true} kpiCount={4} tableRows={6} />;
    }

    return (<motion.div className="space-y-6" initial="hidden" animate="visible" variants={pageEnterVariants(prefersReducedMotion)}>
      {/* Top Header */}
      <PageHeader title={<span className="flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-slate-900 dark:text-[#F4F5F7]"/>
            Sales Orders & Stock Allocation
          </span>} subtitle="B2B customer order lifecycle, inventory reservation, and dispatch fulfillment." actions={can("order:create") ? (<>
            <Button variant="outline" size="sm" onClick={() => setCustomerModalOpen(true)}>
              <Users className="w-4 h-4 mr-1.5"/>
              New Customer
            </Button>
            <Button size="sm" onClick={handleOpenCreateOrder}>
              <Plus className="w-4 h-4 mr-1.5"/>
              Create Sales Order
            </Button>
          </>) : null}/>

      {/* KPI Summary Cards */}
      <KpiGrid>
        <StatCard
          title="Fulfilled Revenue"
          value={totalRevenue}
          prefix="₹"
          formatINR
          icon={IndianRupee}
          subText="Delivered order realizations"
        />
        <StatCard
          title="Pending Orders"
          value={pendingCount}
          icon={Clock}
          subText="Draft + Confirmed awaiting fulfillment"
        />
        <StatCard
          title="Reserved Stock Units"
          value={totalReservedUnits}
          icon={PackageCheck}
          subText="Allocated physical inventory"
        />
        <StatCard
          title="B2B Customers"
          value={customers.length}
          icon={Users}
          subText="Active customer accounts"
        />
      </KpiGrid>

        {/* Orders Table Container */}
        <Card className="">
          <CardHeader className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by order # or customer..." className="w-full sm:w-64"/>

              {/* Status Filter Tabs with Sliding Indicator */}
              <Tabs tabs={["ALL", "DRAFT", "CONFIRMED", "FULFILLED", "CANCELLED"]} activeTab={statusFilter} onChange={setStatusFilter} layoutId="orders-status-tabs" variant="pill"/>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900">{filteredOrders.length}</span> orders
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (<div className="p-4">
                <TableSkeleton rows={6} columns={["w-28", "w-40", "w-28", "w-12", "w-28", "w-24", "w-24"]}/>
                <SkeletonAnnouncer label="Loading sales orders"/>
              </div>) : filteredOrders.length === 0 ? (<EmptyState compact icon={ShoppingCart} title="No sales orders found" description="Create a sales order to reserve and fulfill stock for your customers." action={can("order:create") ? (<Button size="sm" variant="primary" onClick={() => setOrderModalOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5"/>
                    Create Sales Order
                  </Button>) : null}/>) : (<div className="overflow-x-auto touch-pan-x">
                <table className="w-full min-w-[700px] text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => {
                const isActing = actionLoading === o.id;
                const itemCount = o.items.reduce((acc, it) => acc + it.quantity, 0);
                return (<tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900">
                            {o.order_number}
                            <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                              {formatDate(o.created_at)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900">{o.customer?.name || "Customer"}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {o.customer?.company && (<span className="font-medium text-slate-700">
                                  {o.customer.company}
                                </span>)}
                              <span className="text-slate-500 font-mono text-[11px]">
                                {o.customer?.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {o.warehouse ? (<div>
                                <span className="text-slate-700">{o.warehouse.name}</span>
                                <span className="font-mono text-[10px] text-slate-500 block">
                                  {o.warehouse.code}
                                </span>
                              </div>) : ("Default Facility")}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-700">
                            {o.items.length} lines ({itemCount} units)
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{o.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <StatusBadge status={o.status} type="order" />
                          </td>
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => setDetailOrder(o)}
                                title="View Order Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                Details
                              </Button>

                              {o.status === "DRAFT" && (
                                <>
                                  {can("order:confirm") && (
                                    <Button
                                      variant="primary"
                                      size="xs"
                                      onClick={() => handleConfirmOrder(o.id)}
                                      disabled={isActing}
                                      title="Confirm Order Allocation"
                                    >
                                      <PackageCheck className="w-3.5 h-3.5" />
                                      Confirm
                                    </Button>
                                  )}
                                  {can("order:cancel") && (
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => handleCancelOrder(o.id)}
                                      disabled={isActing}
                                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                      title="Cancel Order"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </>
                              )}

                              {o.status === "CONFIRMED" && (
                                <>
                                  {can("order:fulfill") && (
                                    <Button
                                      variant="primary"
                                      size="xs"
                                      onClick={() => handleFulfillOrder(o.id)}
                                      disabled={isActing}
                                      title="Fulfill & Dispatch Stock"
                                    >
                                      <Truck className="w-3.5 h-3.5" />
                                      Fulfill
                                    </Button>
                                  )}
                                  {can("order:cancel") && (
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => handleCancelOrder(o.id)}
                                      disabled={isActing}
                                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                      title="Cancel Order"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </>
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

        {/* Modal: Create Sales Order */}
        <FormModal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          title="Create Sales Order"
          icon={ShoppingCart}
          onSubmit={handleCreateOrderSubmit}
          isSubmitting={orderSubmitting}
          submitText="Create Draft Order"
          error={orderError}
          maxWidth="2xl"
          bodyClassName="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="B2B Customer *">
              <Select
                value={orderCustomerId}
                onChange={(e) => setOrderCustomerId(e.target.value)}
                placeholder="Choose customer..."
                options={customers.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.company ? ` (${c.company})` : ""}`,
                }))}
              />
            </FormField>

            <FormField label="Fulfillment Facility">
              <Select
                value={orderWarehouseId}
                onChange={(e) => setOrderWarehouseId(e.target.value)}
                placeholder="Choose fulfillment warehouse..."
                options={warehouses.map((wh) => ({
                  value: wh.id,
                  label: `${wh.name} (${wh.code})`,
                }))}
              />
            </FormField>
          </div>

          {/* Line Items Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9BA3AF]">
                Order Line Items
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItemRow}
                className="text-xs h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#191B15] border border-slate-200 dark:border-[#2B2E25] text-xs"
                >
                  <div className="flex-1">
                    <Select
                      size="sm"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                      placeholder="Select SKU item..."
                      options={products.map((p) => ({
                        value: p.id,
                        label: `${p.name} [${p.sku}]`,
                      }))}
                    />
                  </div>

                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      placeholder="Qty"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="w-24">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-500 text-xs">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                        placeholder="Price"
                        className="h-9 text-xs pl-6 font-mono"
                      />
                    </div>
                  </div>

                  <div className="w-24 text-right font-mono font-semibold text-slate-900 dark:text-[#F4F5F7]">
                    ₹{(item.quantity * item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={orderItems.length <= 1}
                    className={`p-1.5 rounded transition-colors ${
                      orderItems.length <= 1
                        ? "text-slate-400 cursor-not-allowed"
                        : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between p-3 mt-3 bg-slate-50 dark:bg-[#191B15] rounded-lg border border-slate-200 dark:border-[#2B2E25]">
              <span className="text-xs text-slate-500 dark:text-[#9BA3AF]">
                Total Order Amount ({orderItems.length} items):
              </span>
              <span className="text-base font-bold font-mono text-slate-950 dark:text-[#F4F5F7]">
                ₹{orderCalculatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <FormField label="Order Notes / Reference">
            <Input
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. PO-REF-2024-88, delivery instructions"
            />
          </FormField>
        </FormModal>

        {/* Modal: New Customer */}
        <FormModal
          isOpen={customerModalOpen}
          onClose={() => setCustomerModalOpen(false)}
          title="Add B2B Customer Profile"
          icon={Building2}
          onSubmit={handleCreateCustomerSubmit}
          isSubmitting={custSubmitting}
          submitText="Save Customer"
          error={custError}
          maxWidth="md"
        >
          <FormField label="Contact Name *">
            <Input
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              required
            />
          </FormField>

          <FormField label="Email Address *">
            <Input
              type="email"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              placeholder="e.g. procurement@bharatcorp.in"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Company / Organization">
              <Input
                value={custCompany}
                onChange={(e) => setCustCompany(e.target.value)}
                placeholder="e.g. Bharat Corp Ltd"
              />
            </FormField>
            <FormField label="Phone Number">
              <Input
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="e.g. +91 98200 12345"
              />
            </FormField>
          </div>

          <FormField label="Shipping Address">
            <Input
              value={custShipping}
              onChange={(e) => setCustShipping(e.target.value)}
              placeholder="e.g. Warehouse 4B, MIDC Industrial Area, Pune"
            />
          </FormField>
        </FormModal>

        {/* Modal: Order Details & Status Workflow */}
        <Modal isOpen={!!detailOrder} onClose={() => setDetailOrder(null)} maxWidth="2xl" className="p-6 max-h-[90vh] flex flex-col">
          {detailOrder && (<>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#D8CFBC]/25 text-[#11120D] dark:text-[#D8CFBC] flex items-center justify-center border border-[#C5BBA4] dark:border-[#D8CFBC]/40">
                    <ShoppingCart className="w-5 h-5"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg font-mono">
                      {detailOrder.order_number}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Created on {formatDate(detailOrder.created_at)} &bull; {detailOrder.customer?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={detailOrder.status} type="order" />
                  <button onClick={() => setDetailOrder(null)} className="text-slate-400 hover:text-slate-700 ml-2">
                    <X className="w-5 h-5"/>
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Order Lifecycle Stepper (Real backend state) */}
                <OrderLifecycleStepper status={detailOrder.status} createdAt={detailOrder.created_at} updatedAt={detailOrder.updated_at}/>

                {/* Customer Info Card */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Customer</span>
                    <span className="font-semibold text-slate-900">{detailOrder.customer?.name}</span>
                    {detailOrder.customer?.company && (<span className="text-slate-500 block">{detailOrder.customer.company}</span>)}
                    <span className="text-slate-500 font-mono block mt-0.5">
                      {detailOrder.customer?.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fulfillment Facility</span>
                    <span className="font-semibold text-slate-900">
                      {detailOrder.warehouse?.name || "Samsung Central DC"}
                    </span>
                    <span className="text-slate-500 font-mono block">
                      {detailOrder.warehouse?.code || "WH-MAIN"}
                    </span>
                    {detailOrder.customer?.shipping_address && (<span className="text-slate-600 block mt-1 truncate">
                        Ship To: {detailOrder.customer.shipping_address}
                      </span>)}
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Itemized Order Lines ({detailOrder.items?.length || 0})
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right">Subtotal (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {detailOrder.items?.map((it) => (<tr key={it.id}>
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-slate-900 block">
                                {it.product?.name || "Product"}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                {it.product?.sku || "SKU"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {it.quantity} {it.product?.unit || "units"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              ₹{it.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">
                              ₹{it.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-3 text-right text-slate-500">
                            Total Order Value:
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-950 font-bold">
                            ₹{detailOrder.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* State Machine Explainer Card */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-900"/>
                    Inventory Reservation Status:
                  </div>
                  {detailOrder.status === "DRAFT" && (<p className="text-slate-400 text-[11px]">
                      This order is currently a <strong>DRAFT</strong>. Stock has not yet been reserved.
                      Clicking &quot;Confirm & Reserve&quot; checks available inventory and allocates it.
                    </p>)}
                  {detailOrder.status === "CONFIRMED" && (<p className="text-slate-700 text-[11px]">
                      This order is <strong>CONFIRMED</strong>. Stock is safely reserved in the warehouse and cannot be sold to other orders.
                      Clicking &quot;Fulfill & Dispatch&quot; appends OUT ledger entries and reduces on-hand inventory.
                    </p>)}
                  {detailOrder.status === "FULFILLED" && (<p className="text-slate-900 text-[11px]">
                      This order is <strong>FULFILLED</strong>. Goods have been dispatched from the warehouse and corresponding ledger entries were recorded.
                    </p>)}
                  {detailOrder.status === "CANCELLED" && (<p className="text-slate-400 text-[11px]">
                      This order is <strong>CANCELLED</strong>. Any reserved inventory was returned to the available selling pool.
                    </p>)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2B2E25] mt-4">
                <Button variant="ghost" size="sm" onClick={() => setDetailOrder(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {detailOrder.status === "DRAFT" && (
                    <>
                      {can("order:cancel") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelOrder(detailOrder.id)}
                          disabled={actionLoading === detailOrder.id}
                          className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs"
                        >
                          Cancel Order
                        </Button>
                      )}
                      {can("order:confirm") && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmOrder(detailOrder.id)}
                          disabled={actionLoading === detailOrder.id}
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          Confirm & Reserve Stock
                        </Button>
                      )}
                    </>
                  )}

                  {detailOrder.status === "CONFIRMED" && (
                    <>
                      {can("order:cancel") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelOrder(detailOrder.id)}
                          disabled={actionLoading === detailOrder.id}
                          className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs"
                        >
                          Cancel Order
                        </Button>
                      )}
                      {can("order:fulfill") && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleFulfillOrder(detailOrder.id)}
                          disabled={actionLoading === detailOrder.id}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Fulfill & Dispatch
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>)}
        </Modal>

        <ConfirmModal isOpen={!!orderIdToCancel} onClose={() => setOrderIdToCancel(null)} onConfirm={async () => {
            if (!orderIdToCancel)
                return;
            setActionLoading(orderIdToCancel);
            try {
                const updated = await cancelOrderApi(orderIdToCancel);
                if (detailOrder?.id === orderIdToCancel)
                    setDetailOrder(updated);
                setOrderIdToCancel(null);
                toast.success("Order cancelled", `Order ${updated.order_number} has been cancelled.`);
                await mutate();
            }
            catch (err) {
                toast.error("Cancellation error", err.message || "Unable to cancel order");
            }
            finally {
                setActionLoading(null);
            }
        }} title="Cancel Sales Order" description="Are you sure you want to cancel this order? Any reserved inventory will be automatically released back to available stock." confirmText="Cancel Order" variant="danger"/>
      </motion.div>);
}
