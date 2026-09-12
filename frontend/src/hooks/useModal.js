import { useState, useCallback } from "react";

/**
 * Reusable modal state management hook.
 * Replaces repetitive open/data state boilerplate across forms and detail sheets.
 */
export function useModal(initialData = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(initialData);

  const open = useCallback((payload = null) => {
    setData(payload ?? initialData);
    setIsOpen(true);
  }, [initialData]);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(initialData);
  }, [initialData]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
  };
}
