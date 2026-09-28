import useSWR from "swr";
import {
  fetchProducts,
  fetchCategories,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  fetchInventorySummaries,
  recordMovementApi,
  fetchOrders,
  confirmOrderApi,
  createOrderApi,
  fetchCustomers,
  fetchWarehouses,
} from "@/lib/api";
import { useTenant } from "@/context/TenantContext";

/**
 * Hook: SWR & Optimistic UI for Products & SKUs
 */
export function useProductsData(params = {}) {
  const { currentOrg } = useTenant();
  const orgId = currentOrg?.id || "default";

  // Products SWR
  const productsKey = [`/products`, orgId, params.search || "", params.category_id || ""];
  const {
    data: rawProducts,
    error: productsError,
    isLoading: productsLoading,
    isValidating,
    mutate: mutateProducts,
  } = useSWR(
    productsKey,
    () => fetchProducts(params),
    { revalidateOnFocus: false }
  );
  const products = Array.isArray(rawProducts) ? rawProducts : [];

  // Categories SWR
  const categoriesKey = [`/categories`, orgId];
  const {
    data: rawCategories,
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useSWR(
    categoriesKey,
    () => fetchCategories(),
    { revalidateOnFocus: false }
  );
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  /**
   * Optimistic Product Creation (0ms UI update)
   */
  const createProductOptimistic = async (productData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticProduct = {
      ...productData,
      id: tempId,
      created_at: new Date().toISOString(),
      category: categories.find((c) => c.id === productData.category_id) || null,
    };

    return mutateProducts(
      async (currentList = []) => {
        const list = Array.isArray(currentList) ? currentList : [];
        const created = await createProductApi(productData);
        // Replace temporary optimistic item with verified server item
        return [created, ...list.filter((p) => p.id !== tempId)];
      },
      {
        optimisticData: (currentList = []) => {
          const list = Array.isArray(currentList) ? currentList : [];
          return [optimisticProduct, ...list];
        },
        rollbackOnError: true,
        populateCache: true,
        revalidate: true,
      }
    );
  };

  /**
   * Optimistic Product Update (0ms UI update)
   */
  const updateProductOptimistic = async (productId, updatedData) => {
    return mutateProducts(
      async (currentList = []) => {
        const list = Array.isArray(currentList) ? currentList : [];
        const verified = await updateProductApi(productId, updatedData);
        return list.map((p) => (p.id === productId ? verified : p));
      },
      {
        optimisticData: (currentList = []) => {
          const list = Array.isArray(currentList) ? currentList : [];
          return list.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  ...updatedData,
                  category: updatedData.category_id
                    ? categories.find((c) => c.id === updatedData.category_id) || p.category
                    : p.category,
                }
              : p
          );
        },
        rollbackOnError: true,
        populateCache: true,
        revalidate: true,
      }
    );
  };

  /**
   * Optimistic Product Deletion (0ms UI update)
   */
  const deleteProductOptimistic = async (productId) => {
    return mutateProducts(
      async (currentList = []) => {
        const list = Array.isArray(currentList) ? currentList : [];
        await deleteProductApi(productId);
        return list.filter((p) => p.id !== productId);
      },
      {
        optimisticData: (currentList = []) => {
          const list = Array.isArray(currentList) ? currentList : [];
          return list.filter((p) => p.id !== productId);
        },
        rollbackOnError: true,
        populateCache: true,
        revalidate: true,
      }
    );
  };

  return {
    products,
    categories,
    isLoading: productsLoading || categoriesLoading,
    isValidating,
    error: productsError || categoriesError,
    createProduct: createProductOptimistic,
    updateProduct: updateProductOptimistic,
    deleteProduct: deleteProductOptimistic,
    mutate: mutateProducts,
  };
}

/**
 * Hook: SWR & Optimistic UI for Inventory Ledger
 */
export function useInventoryData() {
  const { currentOrg } = useTenant();
  const orgId = currentOrg?.id || "default";

  const inventoryKey = [`/inventory`, orgId];
  const {
    data: rawSummaries,
    error,
    isLoading,
    isValidating,
    mutate: mutateInventory,
  } = useSWR(
    inventoryKey,
    () => fetchInventorySummaries(),
    { revalidateOnFocus: false }
  );
  const summaries = Array.isArray(rawSummaries) ? rawSummaries : [];

  /**
   * Optimistic Stock Movement (0ms instant calculation on on-hand quantities)
   */
  const recordMovementOptimistic = async (movementPayload) => {
    const { product_id, movement_type, quantity } = movementPayload;
    const qty = Number(quantity || 0);

    return mutateInventory(
      async () => {
        await recordMovementApi(movementPayload);
        // Background re-fetch will synchronize exact financial calculations
        const fresh = await fetchInventorySummaries();
        return Array.isArray(fresh) ? fresh : [];
      },
      {
        optimisticData: (currentList = []) => {
          const list = Array.isArray(currentList) ? currentList : [];
          return list.map((s) => {
            if (s.product?.id !== product_id) return s;
            let newOnHand = Number(s.on_hand_quantity || 0);
            if (movement_type === "IN") newOnHand += qty;
            else if (movement_type === "OUT") newOnHand = Math.max(0, newOnHand - qty);
            else if (movement_type === "ADJUSTMENT") newOnHand = qty;

            const cost = Number(s.product?.cost_price || 0);
            return {
              ...s,
              on_hand_quantity: newOnHand,
              total_cost_value: newOnHand * cost,
              is_low_stock: newOnHand <= (s.reorder_point || 0),
            };
          });
        },
        rollbackOnError: true,
        populateCache: true,
        revalidate: true,
      }
    );
  };

  return {
    summaries,
    isLoading,
    isValidating,
    error,
    recordMovement: recordMovementOptimistic,
    mutate: mutateInventory,
  };
}

/**
 * Hook: SWR & Optimistic UI for Orders & Sales
 */
export function useOrdersData(params = {}) {
  const { currentOrg } = useTenant();
  const orgId = currentOrg?.id || "default";

  const ordersKey = [`/orders`, orgId, params.status || ""];
  const {
    data: rawOrders,
    error: ordersError,
    isLoading: ordersLoading,
    isValidating,
    mutate: mutateOrders,
  } = useSWR(
    ordersKey,
    () => fetchOrders(params),
    { revalidateOnFocus: false }
  );
  const orders = Array.isArray(rawOrders) ? rawOrders : [];

  const { data: rawCustomers } = useSWR([`/customers`, orgId], () => fetchCustomers(), { revalidateOnFocus: false });
  const customers = Array.isArray(rawCustomers) ? rawCustomers : [];

  const { data: rawWarehouses } = useSWR([`/warehouses`, orgId], () => fetchWarehouses(), { revalidateOnFocus: false });
  const warehouses = Array.isArray(rawWarehouses) ? rawWarehouses : [];

  const { data: rawProducts } = useSWR([`/products-all`, orgId], () => fetchProducts({}), { revalidateOnFocus: false });
  const products = Array.isArray(rawProducts) ? rawProducts : [];

  /**
   * Optimistic Order Confirmation (0ms badge change to CONFIRMED)
   */
  const confirmOrderOptimistic = async (orderId) => {
    return mutateOrders(
      async (currentList = []) => {
        const list = Array.isArray(currentList) ? currentList : [];
        const verified = await confirmOrderApi(orderId);
        return list.map((o) => (o.id === orderId ? verified : o));
      },
      {
        optimisticData: (currentList = []) => {
          const list = Array.isArray(currentList) ? currentList : [];
          return list.map((o) =>
            o.id === orderId ? { ...o, status: "CONFIRMED" } : o
          );
        },
        rollbackOnError: true,
        populateCache: true,
        revalidate: true,
      }
    );
  };

  /**
   * Optimistic Order Creation (0ms instant registration in Draft)
   */
  const createOrderOptimistic = async (orderPayload) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticOrder = {
      ...orderPayload,
      id: tempId,
      order_number: `ORD-${Date.now().toString().slice(-4)}`,
      status: "DRAFT",
      created_at: new Date().toISOString(),
      customer: customers.find((c) => c.id === orderPayload.customer_id) || null,
      warehouse: warehouses.find((w) => w.id === orderPayload.warehouse_id) || null,
      total_amount: orderPayload.items?.reduce((acc, i) => acc + i.quantity * i.unit_price, 0) || 0,
    };

    return mutateOrders(
      async (currentList = []) => {
        const list = Array.isArray(currentList) ? currentList : [];
        const verified = await createOrderApi(orderPayload);
        return [verified, ...list.filter((o) => o.id !== tempId)];
      },
      {
        optimisticData: (currentList = []) => {
          const list = Array.isArray(currentList) ? currentList : [];
          return [optimisticOrder, ...list];
        },
        rollbackOnError: true,
        populateCache: true,
        revalidate: true,
      }
    );
  };

  return {
    orders,
    customers,
    warehouses,
    products,
    isLoading: ordersLoading,
    isValidating,
    error: ordersError,
    confirmOrder: confirmOrderOptimistic,
    createOrder: createOrderOptimistic,
    mutate: mutateOrders,
  };
}
