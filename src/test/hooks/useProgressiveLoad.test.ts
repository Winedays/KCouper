import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProgressiveLoad } from "@/hooks/useProgressiveLoad";

describe("useProgressiveLoad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初始化", () => {
    it("應該以初始數量初始化 visibleCount", () => {
      const { result } = renderHook(() => useProgressiveLoad(100, 30, 30));
      expect(result.current.visibleCount).toBe(30);
    });

    it("當總數小於初始數量時，visibleCount 應該等於總數", () => {
      const { result } = renderHook(() => useProgressiveLoad(10, 30, 30));
      expect(result.current.visibleCount).toBe(10);
    });

    it("應該回傳 sentinelRef", () => {
      const { result } = renderHook(() => useProgressiveLoad(100, 30, 30));
      expect(result.current.sentinelRef).toBeDefined();
      expect(typeof result.current.sentinelRef).toBe("function");
    });
  });

  describe("hasMore", () => {
    it("當還有更多項目時應該回傳 true", () => {
      const { result } = renderHook(() => useProgressiveLoad(100, 30, 30));
      expect(result.current.hasMore).toBe(true);
    });

    it("當沒有更多項目時應該回傳 false", () => {
      const { result } = renderHook(() => useProgressiveLoad(10, 30, 30));
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe("loadMore", () => {
    it("應該增加 visibleCount 一個批次大小", () => {
      const { result } = renderHook(() => useProgressiveLoad(100, 30, 30));

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.visibleCount).toBe(60);
    });

    it("不應該讓 visibleCount 超過總數", () => {
      const { result } = renderHook(() => useProgressiveLoad(50, 30, 30));

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.visibleCount).toBe(50);
    });

    it("應該能夠連續載入多個批次", () => {
      const { result } = renderHook(() => useProgressiveLoad(100, 20, 20));

      act(() => {
        result.current.loadMore();
      });
      expect(result.current.visibleCount).toBe(40);

      act(() => {
        result.current.loadMore();
      });
      expect(result.current.visibleCount).toBe(60);
    });
  });

  describe("totalItems 變更", () => {
    it("當 totalItems 變更時應該重置 visibleCount", () => {
      const { result, rerender } = renderHook(
        ({ totalItems }) => useProgressiveLoad(totalItems, 30, 30),
        { initialProps: { totalItems: 100 } }
      );

      act(() => {
        result.current.loadMore();
      });
      expect(result.current.visibleCount).toBe(60);

      rerender({ totalItems: 50 });
      expect(result.current.visibleCount).toBe(30);
    });
  });

  describe("自訂批次大小", () => {
    it("應該使用自訂的初始數量", () => {
      const { result } = renderHook(() => useProgressiveLoad(100, 50, 30));
      expect(result.current.visibleCount).toBe(50);
    });

    it("應該使用自訂的批次大小", () => {
      const { result } = renderHook(() => useProgressiveLoad(100, 30, 50));

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.visibleCount).toBe(80);
    });
  });
});
