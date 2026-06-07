import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for progressive loading of items
 * @param totalItems - Total number of items to load
 * @param initialCount - Number of items to show initially (default: 30)
 * @param batchSize - Number of items to load per batch (default: 30)
 * @returns Object with visibleCount, hasMore, loadMore, and sentinelRef
 */
export const useProgressiveLoad = (
  totalItems: number,
  initialCount: number = 30,
  batchSize: number = 30
) => {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count when total items change significantly
  useEffect(() => {
    setVisibleCount(Math.min(initialCount, totalItems));
  }, [totalItems, initialCount]);

  const hasMore = visibleCount < totalItems;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + batchSize, totalItems));
  }, [batchSize, totalItems]);

  // Recreate observer when dependencies change
  useEffect(() => {
    observerRef.current?.disconnect();

    if (!hasMore) {
      observerRef.current = null;
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    // If sentinel is already mounted, observe it
    if (sentinelNodeRef.current) {
      observerRef.current.observe(sentinelNodeRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loadMore]);

  // Callback ref: re-observe whenever the sentinel DOM node changes
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Unobserve old node
      if (sentinelNodeRef.current && observerRef.current) {
        observerRef.current.unobserve(sentinelNodeRef.current);
      }
      sentinelNodeRef.current = node;
      // Observe new node
      if (node && observerRef.current) {
        observerRef.current.observe(node);
      }
    },
    []
  );

  return {
    visibleCount,
    hasMore,
    loadMore,
    sentinelRef,
  };
};
