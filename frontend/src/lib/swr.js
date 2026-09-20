import useSWR, { mutate, useSWRConfig } from "swr";

export { useSWR, mutate, useSWRConfig };

/**
 * Enterprise SWR Configuration for FlowStock OS.
 * Engineered for fast 0ms navigation and resilient offline/intermittent Wi-Fi handling.
 */
export const swrConfig = {
  revalidateOnFocus: false, // Avoid jarring layout refetches while user is entering data into inputs
  revalidateOnReconnect: true, // Instantly refresh when warehouse connection restores
  dedupingInterval: 3000, // Dedupe identical requests within 3 seconds
  keepPreviousData: true, // Keep previous data visible during page switches (0ms load time)
  errorRetryCount: 3, // Auto-retry transient network failures
};

/**
 * Helper to perform Google-grade Optimistic UI mutations with SWR.
 * 
 * 1. Immediately updates local UI state (0ms delay)
 * 2. Runs the server request in background
 * 3. Reconciles with server response
 * 4. Automatically rolls back to previous state if server request fails
 */
export async function optimisticMutate(key, asyncAction, optimisticTransformer) {
  return mutate(
    key,
    async (currentData) => {
      // Server execution
      const serverResult = await asyncAction();
      // If transformer returns a full array with serverResult integrated:
      if (typeof optimisticTransformer === "function") {
        return optimisticTransformer(currentData, serverResult);
      }
      return serverResult;
    },
    {
      optimisticData: (currentData) => {
        if (typeof optimisticTransformer === "function") {
          return optimisticTransformer(currentData, null);
        }
        return currentData;
      },
      rollbackOnError: true,
      populateCache: true,
      revalidate: true,
    }
  );
}
