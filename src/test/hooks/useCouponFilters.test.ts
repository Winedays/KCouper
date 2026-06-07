import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCouponFilters } from "@/hooks/useCouponFilters";
import type { Coupon } from "@/data/coupons";

/**
 * Helper to create a mock coupon
 */
const makeCoupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  name: "測試優惠券",
  product_code: "TA1234",
  coupon_code: 10001,
  items: [{ name: "原味蛋撻", count: 1, addition_price: 0, flavors: [] }],
  start_date: "2025-01-01",
  end_date: "2025-12-31",
  price: 49,
  original_price: 80,
  discount: 6.1,
  ...overrides,
});

const MOCK_COUPONS: Coupon[] = [
  makeCoupon({
    coupon_code: 10001,
    name: "蛋撻優惠",
    product_code: "TA1234",
    price: 49,
    items: [{ name: "原味蛋撻", count: 1, addition_price: 0, flavors: [] }],
  }),
  makeCoupon({
    coupon_code: 20002,
    name: "雞塊套餐",
    product_code: "TA5678",
    price: 99,
    items: [{ name: "上校雞塊", count: 4, addition_price: 0, flavors: [{ name: "蜂蜜芥末", addition_price: 0 }] }],
  }),
  makeCoupon({
    coupon_code: 30003,
    name: "炸雞超值餐",
    product_code: "TA9999",
    price: 149,
    discount: 7.5,
    items: [{ name: "咔啦脆雞", count: 2, addition_price: 0, flavors: [] }],
  }),
];

const EMPTY_FAVORITES = new Set<number>();

describe("useCouponFilters", () => {
  const setup = (coupons = MOCK_COUPONS, favorites = EMPTY_FAVORITES) =>
    renderHook(() => useCouponFilters(coupons, favorites));

  describe("初始狀態", () => {
    it("應返回所有優惠券（無篩選）", () => {
      const { result } = setup();
      expect(result.current.filteredAndSortedCoupons).toHaveLength(3);
    });

    it("預設排序為 price-asc", () => {
      const { result } = setup();
      expect(result.current.sortBy).toBe("price-asc");
      const prices = result.current.filteredAndSortedCoupons.map((c) => c.price);
      expect(prices).toEqual([49, 99, 149]);
    });
  });

  describe("搜尋功能", () => {
    it("應能用 coupon name 搜尋", () => {
      const { result } = setup();
      act(() => result.current.setSearchQuery("蛋撻"));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(10001);
    });

    it("應能用 coupon_code 搜尋", () => {
      const { result } = setup();
      act(() => result.current.setSearchQuery("20002"));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(20002);
    });

    it("應能用 item name 搜尋", () => {
      const { result } = setup();
      act(() => result.current.setSearchQuery("上校雞塊"));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(20002);
    });

    it("不應匹配 product_code", () => {
      const { result } = setup();
      act(() => result.current.setSearchQuery("TA1234"));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(0);
    });

    it("不應匹配 product_code 子字串", () => {
      const { result } = setup();
      act(() => result.current.setSearchQuery("5678"));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(0);
    });

    it("searchAllOptions 開啟時應搜尋 flavor name", () => {
      const { result } = setup();
      act(() => {
        result.current.setSearchAllOptions(true);
        result.current.setSearchQuery("蜂蜜芥末");
      });
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(20002);
    });

    it("searchAllOptions 關閉時不應搜尋 flavor name", () => {
      const { result } = setup();
      act(() => {
        result.current.setSearchAllOptions(false);
        result.current.setSearchQuery("蜂蜜芥末");
      });
      expect(result.current.filteredAndSortedCoupons).toHaveLength(0);
    });
  });

  describe("Item filter 篩選", () => {
    it("應依據 filterMatchRules 篩選", () => {
      const { result } = setup();
      act(() => result.current.handleFilterToggle("蛋撻"));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(10001);
    });

    it("多重篩選應取交集", () => {
      const { result } = setup();
      act(() => {
        result.current.handleFilterToggle("蛋撻");
        result.current.handleFilterToggle("雞塊");
      });
      // 沒有同時包含蛋撻和雞塊的優惠券
      expect(result.current.filteredAndSortedCoupons).toHaveLength(0);
    });

    it("清除篩選應還原", () => {
      const { result } = setup();
      act(() => result.current.handleFilterToggle("蛋撻"));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      act(() => result.current.handleClearFilters());
      expect(result.current.filteredAndSortedCoupons).toHaveLength(3);
    });
  });

  describe("數量篩選", () => {
    it("篩選數量 >= 2 應只返回符合條件的優惠券", () => {
      const { result } = setup();
      // 啟用炸雞篩選（預設 count=1）
      act(() => result.current.handleFilterToggle("炸雞"));
      // 應匹配 coupon 30003（咔啦脆雞 count=2）
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(30003);

      // 增加到 count >= 2
      act(() => result.current.handleFilterCountChange("炸雞", 1));
      expect(result.current.activeFilters["炸雞"]).toBe(2);
      // 仍匹配（coupon 30003 有 count=2）
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);

      // 增加到 count >= 3，應無匹配
      act(() => result.current.handleFilterCountChange("炸雞", 1));
      expect(result.current.activeFilters["炸雞"]).toBe(3);
      expect(result.current.filteredAndSortedCoupons).toHaveLength(0);
    });

    it("數量減至 0 時應自動移除篩選", () => {
      const { result } = setup();
      act(() => result.current.handleFilterToggle("蛋撻"));
      expect(result.current.activeFilters["蛋撻"]).toBe(1);

      act(() => result.current.handleFilterCountChange("蛋撻", -1));
      expect(result.current.activeFilters["蛋撻"]).toBeUndefined();
      expect(result.current.filteredAndSortedCoupons).toHaveLength(3);
    });

    it("雞塊數量篩選 >= 4 應匹配", () => {
      const { result } = setup();
      act(() => result.current.handleFilterToggle("雞塊"));
      // 預設 count=1，應匹配 coupon 20002（上校雞塊 count=4）
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      
      // 增加到 count >= 4
      act(() => result.current.handleFilterCountChange("雞塊", 3));
      expect(result.current.activeFilters["雞塊"]).toBe(4);
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);

      // 增加到 count >= 5，無匹配
      act(() => result.current.handleFilterCountChange("雞塊", 1));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(0);
    });

    it("handleClearFilters 應清除所有數量篩選", () => {
      const { result } = setup();
      act(() => {
        result.current.handleFilterToggle("蛋撻");
        result.current.handleFilterCountChange("蛋撻", 1);
        result.current.handleFilterToggle("雞塊");
      });
      expect(Object.keys(result.current.activeFilters).length).toBe(2);

      act(() => result.current.handleClearFilters());
      expect(Object.keys(result.current.activeFilters).length).toBe(0);
      expect(result.current.filteredAndSortedCoupons).toHaveLength(3);
    });
  });

  describe("收藏篩選", () => {
    it("只顯示收藏應過濾非收藏優惠券", () => {
      const favorites = new Set([10001]);
      const { result } = setup(MOCK_COUPONS, favorites);
      act(() => result.current.handleToggleFavorites());
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(10001);
    });
  });

  describe("排序", () => {
    it("price-desc 應由高到低", () => {
      const { result } = setup();
      act(() => result.current.setSortBy("price-desc"));
      const prices = result.current.filteredAndSortedCoupons.map((c) => c.price);
      expect(prices).toEqual([149, 99, 49]);
    });

    it("code-asc 應由小到大", () => {
      const { result } = setup();
      act(() => result.current.setSortBy("code-asc"));
      const codes = result.current.filteredAndSortedCoupons.map((c) => c.coupon_code);
      expect(codes).toEqual([10001, 20002, 30003]);
    });
  });

  describe("價格範圍", () => {
    it("應依據價格範圍篩選", () => {
      const { result } = setup();
      act(() => result.current.setPriceRange([50, 100]));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(20002);
    });

    it("priceStats 應計算正確的最小與最大值", () => {
      const { result } = setup();
      expect(result.current.priceStats).toEqual({ min: 49, max: 149 });
    });
  });
});
