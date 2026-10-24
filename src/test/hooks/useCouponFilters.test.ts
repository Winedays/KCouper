import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCouponFilters, matchOrderType } from "@/hooks/useCouponFilters";
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

  describe("外送/自取篩選", () => {
    const ORDER_TYPE_COUPONS: Coupon[] = [
      makeCoupon({ coupon_code: 1, price: 10, order_types: [2] }),
      makeCoupon({ coupon_code: 2, price: 20, order_types: [1, 2] }),
      makeCoupon({ coupon_code: 3, price: 30, order_types: [1] }),
      makeCoupon({ coupon_code: 4, price: 40 }),
    ];

    it("預設不篩選", () => {
      const { result } = setup(ORDER_TYPE_COUPONS);
      expect(result.current.orderTypeFilter).toBeNull();
      expect(result.current.filteredAndSortedCoupons).toHaveLength(4);
    });

    it("外送應顯示含外送與未標記的優惠券", () => {
      const { result } = setup(ORDER_TYPE_COUPONS);
      act(() => result.current.handleOrderTypeToggle("delivery"));
      expect(result.current.filteredAndSortedCoupons.map((c) => c.coupon_code)).toEqual([2, 3, 4]);
    });

    it("自取應顯示含自取與未標記的優惠券", () => {
      const { result } = setup(ORDER_TYPE_COUPONS);
      act(() => result.current.handleOrderTypeToggle("pickup"));
      expect(result.current.filteredAndSortedCoupons.map((c) => c.coupon_code)).toEqual([1, 2, 4]);
    });

    it("再點一次應取消篩選", () => {
      const { result } = setup(ORDER_TYPE_COUPONS);
      act(() => result.current.handleOrderTypeToggle("delivery"));
      act(() => result.current.handleOrderTypeToggle("delivery"));
      expect(result.current.orderTypeFilter).toBeNull();
      expect(result.current.filteredAndSortedCoupons).toHaveLength(4);
    });

    it("切換到另一個選項應為單選", () => {
      const { result } = setup(ORDER_TYPE_COUPONS);
      act(() => result.current.handleOrderTypeToggle("delivery"));
      act(() => result.current.handleOrderTypeToggle("pickup"));
      expect(result.current.orderTypeFilter).toBe("pickup");
    });

    it("清除篩選應重設外送/自取", () => {
      const { result } = setup(ORDER_TYPE_COUPONS);
      act(() => result.current.handleOrderTypeToggle("delivery"));
      act(() => result.current.handleClearFilters());
      expect(result.current.orderTypeFilter).toBeNull();
    });

    describe("matchOrderType", () => {
      it("filter 為 null 時一律符合", () => {
        expect(matchOrderType(makeCoupon({ order_types: [2] }), null)).toBe(true);
      });

      it("缺少 order_types 時一律符合", () => {
        expect(matchOrderType(makeCoupon(), "delivery")).toBe(true);
        expect(matchOrderType(makeCoupon(), "pickup")).toBe(true);
      });

      it("order_types 為空陣列時一律符合", () => {
        expect(matchOrderType(makeCoupon({ order_types: [] }), "delivery")).toBe(true);
      });

      it("只有自取的券不符合外送", () => {
        const coupon = makeCoupon({ order_types: [2] });
        expect(matchOrderType(coupon, "pickup")).toBe(true);
        expect(matchOrderType(coupon, "delivery")).toBe(false);
      });

      it("只有外送的券不符合自取", () => {
        const coupon = makeCoupon({ order_types: [1] });
        expect(matchOrderType(coupon, "delivery")).toBe(true);
        expect(matchOrderType(coupon, "pickup")).toBe(false);
      });
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

    it("當主排序欄位數值相同時，應依據副排序選項排序", () => {
      const samePriceCoupons: Coupon[] = [
        makeCoupon({
          coupon_code: 30003,
          price: 100,
          discount: 6.5,
          items: [{ name: "原味蛋撻", count: 1, addition_price: 0, flavors: [] }],
        }),
        makeCoupon({
          coupon_code: 10001,
          price: 100,
          discount: 5.0,
          items: [{ name: "上校雞塊", count: 4, addition_price: 0, flavors: [] }],
        }),
        makeCoupon({
          coupon_code: 20002,
          price: 100,
          discount: 5.5,
          items: [{ name: "咔啦脆雞", count: 2, addition_price: 0, flavors: [] }],
        }),
      ];
      const { result } = renderHook(() => useCouponFilters(samePriceCoupons, EMPTY_FAVORITES));

      act(() => {
        result.current.setPrimarySort("price-asc");
        result.current.setSecondarySort("discount-desc");
      });

      const codes = result.current.filteredAndSortedCoupons.map((c) => c.coupon_code);
      expect(codes).toEqual([10001, 20002, 30003]);
    });

    it("當副排序為 none 時，主排序數值相同的項目應退回依 coupon_code 升冪排序", () => {
      const samePriceCoupons: Coupon[] = [
        makeCoupon({
          coupon_code: 30003,
          price: 100,
          discount: 5.0,
          items: [{ name: "原味蛋撻", count: 1, addition_price: 0, flavors: [] }],
        }),
        makeCoupon({
          coupon_code: 10001,
          price: 100,
          discount: 6.5,
          items: [{ name: "上校雞塊", count: 4, addition_price: 0, flavors: [] }],
        }),
        makeCoupon({
          coupon_code: 20002,
          price: 100,
          discount: 5.5,
          items: [{ name: "咔啦脆雞", count: 2, addition_price: 0, flavors: [] }],
        }),
      ];
      const { result } = renderHook(() => useCouponFilters(samePriceCoupons, EMPTY_FAVORITES));

      act(() => {
        result.current.setPrimarySort("price-asc");
        result.current.setSecondarySort("none");
      });

      const codes = result.current.filteredAndSortedCoupons.map((c) => c.coupon_code);
      expect(codes).toEqual([10001, 20002, 30003]);
    });

    it("當第一排序改為與第二排序相同種類時，應自動清除第二排序", () => {
      const { result } = setup();

      act(() => {
        result.current.setPrimarySort("price-asc");
        result.current.setSecondarySort("discount-desc");
      });
      expect(result.current.primarySort).toBe("price-asc");
      expect(result.current.secondarySort).toBe("discount-desc");

      // 切換第一排序為 discount-asc (與 secondarySort 的 discount 種類相同)
      act(() => {
        result.current.setPrimarySort("discount-asc");
      });

      expect(result.current.primarySort).toBe("discount-asc");
      expect(result.current.secondarySort).toBe("none");
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

  describe("排除篩選", () => {
    it("三段式切換：未選取 -> 包含 -> 排除 -> 未選取", () => {
      const { result } = setup();
      
      // 1. 未選取 -> 包含
      act(() => result.current.handleFilterToggle("蛋撻"));
      expect(result.current.activeFilters["蛋撻"]).toBe(1);
      expect(result.current.excludeFilters.has("蛋撻")).toBe(false);

      // 2. 包含 -> 排除
      act(() => result.current.handleFilterToggle("蛋撻"));
      expect(result.current.activeFilters["蛋撻"]).toBeUndefined();
      expect(result.current.excludeFilters.has("蛋撻")).toBe(true);

      // 3. 排除 -> 未選取
      act(() => result.current.handleFilterToggle("蛋撻"));
      expect(result.current.activeFilters["蛋撻"]).toBeUndefined();
      expect(result.current.excludeFilters.has("蛋撻")).toBe(false);
    });

    it("應正確排除指定品項的優惠券", () => {
      const { result } = setup();
      
      // 排除蛋撻（按兩下）
      act(() => {
        result.current.handleFilterToggle("蛋撻");
        result.current.handleFilterToggle("蛋撻");
      });
      expect(result.current.excludeFilters.has("蛋撻")).toBe(true);
      
      // 原本 3 張中有 1 張有蛋撻 (10001)，剩餘 2 張
      expect(result.current.filteredAndSortedCoupons).toHaveLength(2);
      expect(result.current.filteredAndSortedCoupons.map(c => c.coupon_code)).not.toContain(10001);
    });

    it("清除篩選應重置 excludeFilters", () => {
      const { result } = setup();
      
      act(() => {
        result.current.handleFilterToggle("蛋撻");
        result.current.handleFilterToggle("蛋撻");
      });
      expect(result.current.excludeFilters.has("蛋撻")).toBe(true);
      
      act(() => result.current.handleClearFilters());
      expect(result.current.excludeFilters.size).toBe(0);
    });
  });

  describe("過濾重複優惠券 (hideDuplicates)", () => {
    const DUPLICATE_COUPONS: Coupon[] = [
      makeCoupon({
        coupon_code: 16217,
        name: "16217-夏日金囍",
        price: 38,
        end_date: "2026-12-30",
        meal_periods: [2, 3, 4, 5],
        order_types: [2],
        items: [
          { name: "雙色轉轉QQ球", count: 1, addition_price: 0, flavors: [] },
          { name: "冰無糖綠茶(小)", count: 1, addition_price: 0, flavors: [{ name: "百事可樂(小)", addition_price: 0 }] },
        ],
      }),
      makeCoupon({
        coupon_code: 16412,
        name: "16412-特賣會避暑",
        price: 39,
        end_date: "2027-01-31",
        meal_periods: [2, 3, 4, 5],
        order_types: [2],
        items: [
          { name: "冰無糖綠茶(小)", count: 1, addition_price: 0, flavors: [{ name: "百事可樂(小)", addition_price: 0 }] },
          { name: "雙色轉轉QQ球", count: 1, addition_price: 0, flavors: [] },
        ],
      }),
    ];

    it("預設 hideDuplicates 應為 true，且相同內容時優先保留價格最低者", () => {
      const { result } = setup(DUPLICATE_COUPONS);
      expect(result.current.hideDuplicates).toBe(true);
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(16217);
    });

    it("當價格相同時，應優先保留到期日期最晚者", () => {
      const samePriceDiffDate: Coupon[] = [
        makeCoupon({ coupon_code: 1001, price: 50, end_date: "2026-11-30" }),
        makeCoupon({ coupon_code: 1002, price: 50, end_date: "2026-12-31" }),
      ];
      const { result } = setup(samePriceDiffDate);
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(1002);
    });

    it("當價格與到期日皆相同時，應優先保留 coupon_code 較小者", () => {
      const tieCoupons: Coupon[] = [
        makeCoupon({ coupon_code: 26833, price: 85, end_date: "2026-10-31" }),
        makeCoupon({ coupon_code: 26832, price: 85, end_date: "2026-10-31" }),
      ];
      const { result } = setup(tieCoupons);
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(26832);
    });

    it("當支援的時段 (meal_periods) 不同時，應視為不同優惠券並同時保留", () => {
      const diffMealPeriods: Coupon[] = [
        makeCoupon({ coupon_code: 1001, price: 38, meal_periods: [1] }),
        makeCoupon({ coupon_code: 1002, price: 39, meal_periods: [2, 3, 4, 5] }),
      ];
      const { result } = setup(diffMealPeriods);
      act(() => result.current.setMealPeriodFilter(null));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(2);
    });

    it("當支援的取餐方式 (order_types) 不同時，應視為不同優惠券並同時保留", () => {
      const diffOrderTypes: Coupon[] = [
        makeCoupon({ coupon_code: 1001, price: 38, order_types: [1] }),
        makeCoupon({ coupon_code: 1002, price: 39, order_types: [2] }),
      ];
      const { result } = setup(diffOrderTypes);
      expect(result.current.filteredAndSortedCoupons).toHaveLength(2);
    });

    it("當關閉 hideDuplicates 時，應顯示所有重複優惠券", () => {
      const { result } = setup(DUPLICATE_COUPONS);
      act(() => result.current.setHideDuplicates(false));
      expect(result.current.hideDuplicates).toBe(false);
      expect(result.current.filteredAndSortedCoupons).toHaveLength(2);
    });

    it("當直接以較貴的優惠碼搜尋 (如 16412) 時，即使 hideDuplicates 為 true 仍應顯示該券", () => {
      const { result } = setup(DUPLICATE_COUPONS);
      act(() => result.current.setSearchQuery("16412"));
      expect(result.current.filteredAndSortedCoupons).toHaveLength(1);
      expect(result.current.filteredAndSortedCoupons[0].coupon_code).toBe(16412);
    });
  });
});
