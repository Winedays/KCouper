import { useState, useCallback } from "react";
import { toast } from "sonner";

const MAX_COMPARE = 4;

/**
 * Hook for managing coupon comparison state
 * @returns Compare list state and actions
 */
export function useCompare() {
  const [compareList, setCompareList] = useState<Set<number>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleCompare = useCallback((code: number) => {
    setCompareList((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        if (next.size >= MAX_COMPARE) {
          toast.error(`最多只能比較 ${MAX_COMPARE} 張優惠券`);
          return prev;
        }
        next.add(code);
      }
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList(new Set());
  }, []);

  const isComparing = useCallback(
    (code: number) => compareList.has(code),
    [compareList]
  );

  return {
    compareList,
    compareCount: compareList.size,
    toggleCompare,
    clearCompare,
    isComparing,
    isDialogOpen,
    setIsDialogOpen,
  };
}
