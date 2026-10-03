import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Package,
  Search,
  ShoppingCart,
  Truck,
  Compass,
  Layers,
  Receipt,
  Warehouse,
  ArrowRight,
  CornerDownLeft,
  X,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { fetchInvoices, fetchOrders, fetchProducts, fetchPurchaseOrders, fetchShipments } from "@/lib/api";
import { createStaggerContainer, slideUpVariants, useReducedMotion } from "@/motion";

const TYPE_ICONS = {
  Product: Package,
  Order: ShoppingCart,
  "Purchase order": FileText,
  Shipment: Truck,
  Invoice: Receipt,
  Navigation: Compass,
};

const QUICK_LINKS = [
  { label: "Products Catalog", path: "/products", detail: "SKUs, variants, prices & stock levels", icon: Package, badge: "Catalog" },
  { label: "Inventory Ledger", path: "/inventory", detail: "Real-time valuations & double-entry ledger", icon: Layers, badge: "Ledger" },
  { label: "Customer Orders", path: "/orders", detail: "Sales fulfillments & dispatch operations", icon: ShoppingCart, badge: "Sales" },
  { label: "Purchase Orders", path: "/purchasing", detail: "Procurement, supplier invoices & receipts", icon: FileText, badge: "Procurement" },
  { label: "Invoices & Receivables", path: "/invoices", detail: "GST compliance, tax calculations & aging", icon: Receipt, badge: "Finance" },
  { label: "Shipments & Tracking", path: "/shipments", detail: "Carrier dispatches & live delivery milestones", icon: Truck, badge: "Logistics" },
  { label: "Warehouses & Storage", path: "/warehouses", detail: "Zones, bins, capacity & stock distribution", icon: Warehouse, badge: "Storage" },
];

let cachedSearchData = null;
let lastCacheTime = 0;

/** Searches existing API data with 60s cache; it does not create a separate search index or demo data. */
export const GlobalSearch = ({ onOpen }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const openSearch = () => {
    setIsOpen(true);
    setSelectedIndex(0);
    onOpen?.();
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target;
      const isTyping = target?.matches("input, textarea, select, [contenteditable='true']");
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash = event.key === "/" && !isTyping;
      if (isCmdK || isSlash) {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (cachedSearchData && Date.now() - lastCacheTime < 60000) {
      setResults(cachedSearchData);
      return;
    }

    let active = true;
    setLoading(true);
    Promise.all([fetchProducts(), fetchOrders(), fetchPurchaseOrders(), fetchShipments(), fetchInvoices()])
      .then(([products, orders, purchaseOrders, shipments, invoices]) => {
        if (!active) return;
        const mapped = [
          ...products.map((item) => ({ id: item.id, title: item.name, detail: item.sku, to: "/products", type: "Product" })),
          ...orders.map((item) => ({ id: item.id, title: item.order_number, detail: item.customer?.name || item.status, to: "/orders", type: "Order" })),
          ...purchaseOrders.map((item) => ({ id: item.id, title: item.po_number, detail: item.supplier?.name || item.status, to: "/purchasing", type: "Purchase order" })),
          ...shipments.map((item) => ({ id: item.id, title: item.tracking_number || item.shipment_number, detail: `${item.carrier} · ${item.status}`, to: "/shipments", type: "Shipment" })),
          ...invoices.map((item) => ({ id: item.id, title: item.invoice_number, detail: item.customer?.name || item.status, to: "/invoices", type: "Invoice" })),
        ];
        cachedSearchData = mapped;
        lastCacheTime = Date.now();
        setResults(mapped);
      })
      .catch(() => {
        if (active) setResults([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return results
      .filter((item) => `${item.title} ${item.detail} ${item.type}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [query, results]);

  const activeItems = useMemo(() => {
    if (query.trim()) {
      return filteredResults;
    }
    return QUICK_LINKS.map((link) => ({
      id: link.path,
      title: link.label,
      detail: link.detail,
      to: link.path,
      type: link.badge,
      icon: link.icon,
    }));
  }, [query, filteredResults]);

  // Reset selectedIndex whenever query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleSelect = (to) => {
    close();
    navigate(to);
  };

  // Keyboard navigation inside search palette
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (activeItems.length > 0 ? (prev + 1) % activeItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (activeItems.length > 0 ? (prev - 1 + activeItems.length) % activeItems.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeItems[selectedIndex]) {
        handleSelect(activeItems[selectedIndex].to);
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  return (
    <>
      {/* Luxury Tactile Trigger Button */}
      <button
        type="button"
        onClick={openSearch}
        className="group relative w-full h-9 px-3 rounded-lg border border-slate-200/80 dark:border-[#262833] bg-slate-100/70 dark:bg-[#16171C] hover:bg-slate-100 dark:hover:bg-[#1E2026] text-xs transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-[#D8CFBC]"
        aria-label="Search FlowStock records (Ctrl+K or /)"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#808594] shrink-0 group-hover:text-slate-600 dark:group-hover:text-[#D8CFBC] transition-colors" />
          <span className="truncate text-slate-400 dark:text-[#808594] group-hover:text-slate-600 dark:group-hover:text-[#CBD5E1] transition-colors font-medium">
            Search products, orders, invoices...
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-[#2D3039] bg-white dark:bg-[#22242B] font-mono text-[10px] font-semibold text-slate-500 dark:text-[#D8CFBC] shadow-2xs tracking-tight transition-colors">
            <span className="text-[9px] opacity-75">Ctrl</span>
            <span>K</span>
          </kbd>
          <kbd className="sm:hidden inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-[#2D3039] bg-white dark:bg-[#22242B] font-mono text-[10px] font-semibold text-slate-500 dark:text-[#D8CFBC]">
            /
          </kbd>
        </div>
      </button>

      {/* Command Palette Dialog */}
      <Modal isOpen={isOpen} onClose={close} maxWidth="xl" position="top">
        <div
          onKeyDown={handleKeyDown}
          className="flex flex-col bg-white dark:bg-[#121316] text-slate-900 dark:text-[#F4F5F7] overflow-hidden"
        >
          {/* Search Header Bar */}
          <div className="border-b border-slate-100 dark:border-[#22242B] p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-white dark:bg-[#121316]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Search className="h-5 w-5 text-slate-400 dark:text-[#D8CFBC] shrink-0" />
              <input
                ref={inputRef}
                id="global-search-input"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, orders, shipments, invoices..."
                className="min-w-0 flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-[#FFFBF4] outline-none placeholder:text-slate-400 dark:placeholder:text-[#7C8189]"
              />
            </div>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-[#18191E] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-[#22242B] bg-slate-50 dark:bg-[#18191E] font-mono text-[10px] text-slate-500 dark:text-[#D8CFBC] shadow-2xs font-semibold">
              ESC
            </kbd>
          </div>

          {/* Results / Navigation Body */}
          <div className="max-h-[58vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#22242B]">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-[#7C8189]">
                <Loader2 className="w-5 h-5 animate-spin text-[#565449] dark:text-[#D8CFBC]" />
                <span className="text-xs font-mono">Indexing organization records…</span>
              </div>
            ) : query.trim() && filteredResults.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-[#7C8189] space-y-1">
                <p className="font-semibold text-slate-700 dark:text-[#CBD5E1] text-sm">No records found</p>
                <p>No matching products, orders, or invoices for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <div className="space-y-1">
                {!query.trim() && (
                  <div className="px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-[#7C8189]">
                    Quick Navigation
                  </div>
                )}
                {activeItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon || TYPE_ICONS[item.type] || Compass;

                  return (
                    <div
                      key={`${item.type}-${item.id || item.to}`}
                      onClick={() => handleSelect(item.to)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-all duration-100 cursor-pointer ${
                        isSelected
                          ? "bg-[#D8CFBC]/20 dark:bg-[#D8CFBC]/15 text-slate-950 dark:text-[#FFFBF4] border border-[#D8CFBC]/40 dark:border-[#D8CFBC]/25 shadow-2xs"
                          : "text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100/70 dark:hover:bg-[#18191E] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#090A0C] text-[#D8CFBC] dark:bg-[#D8CFBC] dark:text-[#090A0C]"
                              : "bg-slate-100 dark:bg-[#18191E] text-slate-500 dark:text-[#9BA3AF] group-hover:bg-slate-200 dark:group-hover:bg-[#1E2026]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-xs ${
                              isSelected
                                ? "font-bold text-slate-950 dark:text-white"
                                : "font-medium text-slate-800 dark:text-[#F4F5F7]"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="truncate text-[11px] text-slate-400 dark:text-[#9BA3AF] mt-0.5">
                            {item.detail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-[#7C8189] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B]">
                          {item.type}
                        </span>
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-slate-500 dark:text-[#D8CFBC]">
                            <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#090A0C] border border-slate-200 dark:border-[#22242B] shadow-2xs">
                              ↵
                            </kbd>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Shortcuts Hint */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-[#22242B] bg-slate-50/70 dark:bg-[#090A0C] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#9BA3AF] font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] text-[10px] shadow-2xs font-semibold">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] text-[10px] shadow-2xs font-semibold">
                  ↓
                </kbd>
                <span className="font-sans text-xs">Navigate</span>
              </span>
              <span className="text-slate-300 dark:text-[#22242B]">•</span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] text-[10px] shadow-2xs font-semibold">
                  ↵
                </kbd>
                <span className="font-sans text-xs">Open</span>
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#18191E] border border-slate-200 dark:border-[#22242B] text-[10px] shadow-2xs font-semibold">
                ESC
              </kbd>
              <span className="font-sans text-xs">Close</span>
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};
