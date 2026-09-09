"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Alert } from "@/components/ui/Alert";
import {
  Layers,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Package,
  ArrowUpDown,
} from "lucide-react";
import {
  fetchProducts,
  fetchCategories,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  createCategoryApi,
} from "@/lib/api";
import { Product, Category } from "@/types/api";
import { useTenant } from "@/context/TenantContext";
import { useToast } from "@/context/ToastContext";
import { motion } from "framer-motion";
import { fadeInVariants, useReducedMotion } from "@/motion";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton, SkeletonAnnouncer } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProductsPage() {
  const { currentOrg } = useTenant();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  const loadData = async () => {
    if (products.length === 0) setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        fetchProducts({
          search: searchTerm || undefined,
          category_id: selectedCategory || undefined,
        }),
        fetchCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [currentOrg?.id, selectedCategory, searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

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

  const handleOpenEdit = (p: Product) => {
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

  const handleProductSubmit = async (e: React.FormEvent) => {
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

      if (editingProduct) {
        await updateProductApi(editingProduct.id, payload);
        toast.success("Product updated", `${formData.name} was successfully updated.`);
      } else {
        await createProductApi(payload);
        toast.success("Product created", `${formData.name} was successfully added to catalog.`);
      }
      setProductModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    setCatSubmitting(true);
    setCatError("");
    try {
      await createCategoryApi({ name: catName, description: catDesc });
      toast.success("Category created", `Category "${catName}" is ready.`);
      setCategoryModalOpen(false);
      setCatName("");
      setCatDesc("");
      await loadData();
    } catch (err: any) {
      setCatError(err.message || "Failed to create category");
    } finally {
      setCatSubmitting(false);
    }
  };

  const curr = currentOrg?.currency || "INR";

  return (
    
      <motion.div className="max-w-7xl mx-auto space-y-6" variants={fadeInVariants(prefersReducedMotion)} initial="hidden" animate="visible">
        {/* Title Bar */}
        <PageHeader
          title="Products & SKU Catalog"
          badge={currentOrg && <Badge variant="info" className="capitalize">{currentOrg.name}</Badge>}
          subtitle="Master catalog of stock items, selling rates, and classification"
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryModalOpen(true)}
                className="gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                New Category
              </Button>
              <Button size="sm" onClick={handleOpenAdd} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </>
          }
        />

        {/* Filter & Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchBar
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearchSubmit}
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium shrink-0">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-2.5 py-1.5 focus:border-zinc-950 dark:focus:border-zinc-200 focus:outline-none"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-4 text-center">Reorder Point</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <TableSkeleton rows={6} columns={["w-24", "w-44", "w-28", "w-14", "w-16", "w-16", "w-12", "w-24", "w-20"]} />
                      <SkeletonAnnouncer label="Loading product catalog" />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        compact
                        icon={Package}
                        title="No products found"
                        description="Add your first SKU or adjust your category filter to see catalog items."
                        action={
                          <Button size="sm" variant="primary" onClick={handleOpenAdd} className="gap-1.5 text-xs">
                            <Plus className="w-3.5 h-3.5" />
                            Add Product SKU
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const margin = p.price > 0 ? (((p.price - p.cost_price) / p.price) * 100).toFixed(0) : "0";
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-zinc-800">{p.sku}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-zinc-900">{p.name}</p>
                          {p.description && <p className="text-[11px] text-zinc-400 truncate max-w-xs">{p.description}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[11px] border border-zinc-200">
                            {p.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-zinc-600">{p.unit}</td>
                        <td className="py-3 px-4 text-right font-semibold text-zinc-900 font-mono">
                          ₹{p.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-500 font-mono">
                          ₹{p.cost_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={Number(margin) >= 30 ? "text-zinc-900 font-semibold" : "text-zinc-900"}>
                            {margin}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="warning">{p.reorder_point} {p.unit}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 hover:bg-zinc-200 rounded text-zinc-600 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1 hover:bg-zinc-100 text-zinc-400 hover:text-black rounded transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Product Modal */}
        <Modal isOpen={productModalOpen} onClose={() => setProductModalOpen(false)} maxWidth="lg">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="font-semibold text-zinc-900 text-sm">
                  {editingProduct ? "Edit Product Details" : "Add New Product SKU"}
                </h3>
                <button onClick={() => setProductModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <Alert variant="danger" onClose={() => setFormError("")}>
                  {formError}
                </Alert>
              )}

              <form onSubmit={handleProductSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                  >
                    <option value="">None (Uncategorized)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
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

                <div className="grid grid-cols-2 gap-3">
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

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                  <Button type="button" variant="outline" size="sm" onClick={() => setProductModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={submitting}>
                    {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                </div>
              </form>
            </div>
          </Modal>

        {/* Category Modal */}
        <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} maxWidth="sm">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="font-semibold text-zinc-900 text-sm">Add Category</h3>
                <button onClick={() => setCategoryModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {catError && (
                <Alert variant="danger" onClose={() => setCatError("")}>
                  {catError}
                </Alert>
              )}

              <form onSubmit={handleCategorySubmit} className="space-y-3">
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
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setCategoryModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={catSubmitting}>
                    {catSubmitting ? "Creating..." : "Save Category"}
                  </Button>
                </div>
              </form>
            </div>
          </Modal>

          <ConfirmModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={async () => {
              if (!deleteTarget) return;
              try {
                const targetName = deleteTarget.name;
                await deleteProductApi(deleteTarget.id);
                setDeleteTarget(null);
                toast.success("Product deleted", `${targetName} was successfully removed.`);
                await loadData();
              } catch (err: any) {
                toast.error("Failed to delete", err.message || "An error occurred");
              }
            }}
            title="Delete Product"
            description={
              <>
                Are you sure you want to delete{" "}
                <strong className="text-zinc-900 font-semibold">{deleteTarget?.name}</strong>?
                This will permanently remove the product and its SKU tracking from this organization.
              </>
            }
            confirmText="Delete Product"
            variant="danger"
          />
      </motion.div>
    
  );
}
