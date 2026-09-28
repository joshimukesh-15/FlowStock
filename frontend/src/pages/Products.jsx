"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { Alert } from "@/components/ui/Alert";
import { Plus, Tag, Edit2, Trash2, X, Package, } from "lucide-react";
import { createCategoryApi } from "@/lib/api";
import { useProductsData } from "@/hooks/useFlowStockData";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { motion } from "framer-motion";
import { useReducedMotion, pageEnterVariants } from "@/motion";
import { Modal } from "@/components/ui/Modal";
import { FormModal } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton, SkeletonAnnouncer, PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { selectClass } from "@/lib/utils";

export default function ProductsPage() {
    const { currentOrg } = useTenant();
    const { toast } = useToast();
    const prefersReducedMotion = useReducedMotion();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);

    // SWR & Optimistic UI Hook (0ms Navigation + Instant Mutations)
    const {
        products,
        categories,
        isLoading: loading,
        createProduct,
        updateProduct,
        deleteProduct,
        mutate,
    } = useProductsData({
        search: searchTerm || undefined,
        category_id: selectedCategory || undefined,
    });

    // Product Modal State
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        description: "",
        unit: "pcs",
        price: 0,
        cost_price: 0,
        reorder_point: 10,
        category_id: "",
    });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Category Modal State
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [catName, setCatName] = useState("");
    const [catDesc, setCatDesc] = useState("");
    const [catError, setCatError] = useState("");
    const [catSubmitting, setCatSubmitting] = useState(false);

    const handleOpenAdd = () => {
        setEditingProduct(null);
        setFormData({
            name: "",
            sku: "",
            description: "",
            unit: "pcs",
            price: 0,
            cost_price: 0,
            reorder_point: 10,
            category_id: categories[0]?.id || "",
        });
        setFormError("");
        setProductModalOpen(true);
    };
    const handleOpenEdit = (p) => {
        setEditingProduct(p);
        setFormData({
            name: p.name,
            sku: p.sku,
            description: p.description || "",
            unit: p.unit,
            price: p.price,
            cost_price: p.cost_price,
            reorder_point: p.reorder_point,
            category_id: p.category_id || "",
        });
        setFormError("");
        setProductModalOpen(true);
    };
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError("");
        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                cost_price: Number(formData.cost_price),
                reorder_point: Number(formData.reorder_point),
                category_id: formData.category_id || undefined,
            };
            setProductModalOpen(false);
            if (editingProduct) {
                toast.success("Product updated", `${formData.name} was successfully updated.`);
                await updateProduct(editingProduct.id, payload);
            }
            else {
                toast.success("Product created", `${formData.name} was successfully added to catalog.`);
                await createProduct(payload);
            }
        }
        catch (err) {
            setFormError(err.message || "Operation failed.");
            toast.error("Operation failed", err.message || "Could not save product.");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDeleteProduct = (id, name) => {
        setDeleteTarget({ id, name });
    };
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!catName)
            return;
        setCatSubmitting(true);
        setCatError("");
        try {
            await createCategoryApi({ name: catName, description: catDesc });
            toast.success("Category created", `Category "${catName}" is ready.`);
            setCategoryModalOpen(false);
            setCatName("");
            setCatDesc("");
            mutate();
        }
        catch (err) {
            setCatError(err.message || "Failed to create category");
        }
        finally {
            setCatSubmitting(false);
        }
    };
    const curr = currentOrg?.currency || "INR";
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCategories = Array.isArray(categories) ? categories : [];

    if (loading && safeProducts.length === 0) {
      return <PageSkeleton hasKpis={false} tableRows={6} />;
    }

    return (<motion.div className="max-w-7xl mx-auto space-y-6" variants={pageEnterVariants(prefersReducedMotion)} initial="hidden" animate="visible">
        {/* Title Bar */}
        <PageHeader title="Products & SKU Catalog" badge={currentOrg && <Badge variant="info" className="capitalize">{currentOrg.name}</Badge>} subtitle="Master catalog of stock items, selling rates, and classification" actions={<>
              <RefreshButton onClick={() => mutate()} />
              <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(true)} className="gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#6D8C73] dark:text-[#9BA3AF]"/>
                New Category
              </Button>
              <Button size="sm" onClick={handleOpenAdd} className="gap-1.5">
                <Plus className="w-4 h-4"/>
                Add Product
              </Button>
            </>}/>

        {/* Filter & Search Bar */}
        <Card spotlight={true} className="p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchBar placeholder="Search products by name or SKU..." value={searchTerm} onChange={setSearchTerm} onSubmit={(e) => e?.preventDefault()}/>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6D8C73] dark:text-[#9BA3AF] font-medium shrink-0">Category:</span>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="text-xs rounded-lg border border-[#BDC9B8] dark:border-[#4C6B55] bg-[#F7F3EA] dark:bg-[#1B2A20] text-[#314C3B] dark:text-[#F4F5F7] px-2.5 py-1.5 focus:border-[#92AA97] focus:outline-none">
                <option value="">All Categories ({safeCategories.length})</option>
                {safeCategories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card spotlight={true} className="overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#E2DED2] dark:bg-[#1B2A20] border-b border-[#E2DED2] dark:border-[#4C6B55] text-[#6D8C73] dark:text-[#9BA3AF] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">SKU / Code</th>
                  <th className="py-2.5 px-3.5">Product Name</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5 text-center">Unit</th>
                  <th className="py-2.5 px-3.5 text-right">Selling Price</th>
                  <th className="py-2.5 px-3.5 text-right">Cost Price</th>
                  <th className="py-2.5 px-3.5 text-right">Margin</th>
                  <th className="py-2.5 px-3.5 text-center">Reorder Point</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#4C6B55]">
                {loading ? (<tr>
                    <td colSpan={9} className="p-0">
                      <TableSkeleton rows={6} columns={["w-24", "w-44", "w-28", "w-14", "w-16", "w-16", "w-12", "w-24", "w-20"]}/>
                      <SkeletonAnnouncer label="Loading product catalog"/>
                    </td>
                  </tr>) : safeProducts.length === 0 ? (<tr>
                    <td colSpan={9}>
                      <EmptyState compact icon={Package} title="No products found" description="Add your first SKU or adjust your category filter to see catalog items." action={<Button size="sm" variant="primary" onClick={handleOpenAdd} className="gap-1.5 text-xs">
                            <Plus className="w-3.5 h-3.5"/>
                            Add Product SKU
                          </Button>}/>
                    </td>
                  </tr>) : (safeProducts.map((p) => {
            const margin = p.price > 0 ? (((p.price - p.cost_price) / p.price) * 100).toFixed(0) : "0";
            return (<tr key={p.id} className="hover:bg-[#E2DED2] dark:bg-[#1B2A20]/70 dark:hover:bg-[#314C3B]/50 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-[#314C3B] dark:text-[#F4F5F7]">{p.sku}</td>
                        <td className="py-2.5 px-3.5">
                          <p className="font-medium text-[#314C3B] dark:text-[#F4F5F7]">{p.name}</p>
                          {p.description && <p className="text-[10px] text-[#6D8C73] dark:text-[#7C8189] dark:text-[#6D8C73] dark:text-[#9BA3AF] truncate max-w-xs">{p.description}</p>}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="inline-block px-1.5 py-0.5 bg-[#E2DED2] dark:bg-[#314C3B] dark:bg-[#314C3B] text-[#4C6B55] dark:text-[#CBD5E1] dark:text-[#CBD5E1] rounded text-[10px] border border-[#BDC9B8] dark:border-[#4C6B55]">
                            {p.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-mono text-[#6D8C73] dark:text-[#9BA3AF]">{p.unit}</td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-[#314C3B] dark:text-[#F4F5F7] font-mono">
                          ₹{p.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-[#6D8C73] dark:text-[#9BA3AF] font-mono">
                          ₹{p.cost_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono">
                          <span className={Number(margin) >= 30 ? "text-emerald-600 dark:text-[#92AA97] font-semibold" : "text-[#4C6B55] dark:text-[#CBD5E1] dark:text-[#CBD5E1]"}>
                            {margin}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <Badge variant="warning">{p.reorder_point} {p.unit}</Badge>
                        </td>
                        <td className="py-2.5 px-3.5 text-right space-x-1 whitespace-nowrap">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.90 }}
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 min-w-[32px] min-h-[32px] inline-flex items-center justify-center hover:bg-[#E2DED2] dark:bg-[#314C3B] dark:hover:bg-slate-800 rounded-md text-[#6D8C73] dark:text-[#9BA3AF] hover:text-[#314C3B] dark:text-white dark:hover:text-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#92AA97]"
                            title="Edit Product"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.90 }}
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 min-w-[32px] min-h-[32px] inline-flex items-center justify-center hover:bg-[#E2DED2] dark:bg-[#314C3B] dark:hover:bg-slate-800 text-[#6D8C73] dark:text-[#7C8189] hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            title="Delete Product"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </td>
                      </tr>);
        }))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Product Modal */}
        <FormModal
          isOpen={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          title={editingProduct ? "Edit Product Details" : "Add New Product SKU"}
          icon={Package}
          onSubmit={handleProductSubmit}
          isSubmitting={submitting}
          submitText={editingProduct ? "Update Product" : "Create Product"}
          error={formError}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Product Name *"
              placeholder="e.g. Industrial Pallet Jack"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="SKU Code *"
              placeholder="e.g. SKU-PLT-01"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>

          <FormField label="Category">
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className={selectClass}
            >
              <option value="">None (Uncategorized)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={`Selling Price (${curr})`}
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label={`Cost Price (${curr})`}
              type="number"
              step="0.01"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Unit"
              placeholder="pcs, box, kg"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Reorder Alert Level"
              type="number"
              value={formData.reorder_point}
              onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })}
              required
            />
            <Input
              label="Description"
              placeholder="Specification notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </FormModal>

        {/* Category Modal */}
        <FormModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title="Add Category"
          icon={Tag}
          onSubmit={handleCategorySubmit}
          isSubmitting={catSubmitting}
          submitText="Save Category"
          error={catError}
          maxWidth="sm"
        >
          <Input
            label="Category Name *"
            placeholder="e.g. Storage & Racking"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            required
          />
          <Input
            label="Description"
            placeholder="Optional notes"
            value={catDesc}
            onChange={(e) => setCatDesc(e.target.value)}
          />
        </FormModal>

          <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
            if (!deleteTarget)
                return;
            try {
                const targetId = deleteTarget.id;
                const targetName = deleteTarget.name;
                setDeleteTarget(null);
                toast.success("Product deleted", `${targetName} was successfully removed.`);
                await deleteProduct(targetId);
            }
            catch (err) {
                toast.error("Failed to delete", err.message || "An error occurred");
            }
        }} title="Delete Product" description={<>
                Are you sure you want to delete{" "}
                <strong className="text-[#314C3B] dark:text-white font-semibold">{deleteTarget?.name}</strong>?
                This will permanently remove the product and its SKU tracking from this organization.
              </>} confirmText="Delete Product" variant="danger"/>
      </motion.div>);
}
