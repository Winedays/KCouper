import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { useCoupons } from "@/hooks/useCoupons";
import type { CouponDict, SingleDict } from "@/data/coupons";

describe("useCoupons", () => {
  const mockCouponDict: CouponDict = {
    coupon_list: [
      {
        name: "測試優惠券",
        product_code: "TEST001",
        coupon_code: 12345,
        items: [
          { name: "原味雞", count: 2, addition_price: 0, flavors: [] },
        ],
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        price: 100,
        original_price: 0,
        discount: 10,
      },
    ],
    coupon_by_code: {},
    count: 1,
    last_update: "2024-01-01",
  };

  const mockSingleDict: SingleDict = {
    "原味雞": { code: "C001", name: "原味雞", price: 75, nutrition: "" },
  };

  beforeEach(() => {
    // Reset window globals
    delete (window as any).COUPON_DICT;
    delete (window as any).SINGLE_DICT;
    
    // Store original createElement before spying
    const originalCreateElement = document.createElement.bind(document);
    
    // Mock document.createElement for script loading
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "script") {
        const script = {
          src: "",
          async: false,
          onload: null as any,
          onerror: null as any,
        };
        
        // Simulate script load after a tick
        setTimeout(() => {
          if (script.src.includes("coupon.js")) {
            (window as any).COUPON_DICT = mockCouponDict;
          }
          if (script.src.includes("single.js")) {
            (window as any).SINGLE_DICT = mockSingleDict;
          }
          if (script.onload) script.onload();
        }, 10);
        
        return script as any;
      }
      return originalCreateElement(tagName);
    });

    vi.spyOn(document.head, "appendChild").mockImplementation(() => null as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初始狀態", () => {
    it("應該以 isLoading: true 開始", () => {
      (window as any).COUPON_DICT = mockCouponDict;
      (window as any).SINGLE_DICT = mockSingleDict;
      
      const { result } = renderHook(() => useCoupons());
      expect(result.current.isLoading).toBe(true);
    });

    it("應該以空陣列開始", () => {
      (window as any).COUPON_DICT = mockCouponDict;
      (window as any).SINGLE_DICT = mockSingleDict;
      
      const { result } = renderHook(() => useCoupons());
      expect(result.current.coupons).toEqual([]);
      expect(result.current.count).toBe(0);
    });
  });

  describe("載入資料", () => {
    it("當資料已存在時應該成功載入優惠券", async () => {
      (window as any).COUPON_DICT = mockCouponDict;
      (window as any).SINGLE_DICT = mockSingleDict;

      const { result } = renderHook(() => useCoupons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coupons.length).toBe(1);
      expect(result.current.count).toBe(1);
      expect(result.current.error).toBeNull();
    });

    it("應該正確計算原價和折扣", async () => {
      (window as any).COUPON_DICT = mockCouponDict;
      (window as any).SINGLE_DICT = mockSingleDict;

      const { result } = renderHook(() => useCoupons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const coupon = result.current.coupons[0];
      // 原味雞 75 * 2 = 150
      expect(coupon.original_price).toBe(150);
      // 100 / 150 * 10 = 6.7 折
      expect(coupon.discount).toBe(6.7);
    });

    it("應該建立 couponByCode 對照表", async () => {
      (window as any).COUPON_DICT = mockCouponDict;
      (window as any).SINGLE_DICT = mockSingleDict;

      const { result } = renderHook(() => useCoupons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.couponByCode["12345"]).toBeDefined();
      expect(result.current.couponByCode["12345"].name).toBe("測試優惠券");
    });
  });

  describe("排除項目", () => {
    it("應該在計算原價時排除特定項目", async () => {
      const couponWithExcluded: CouponDict = {
        ...mockCouponDict,
        coupon_list: [
          {
            ...mockCouponDict.coupon_list[0],
            items: [
              { name: "原味雞", count: 2, addition_price: 0, flavors: [] },
              { name: "糖醋醬", count: 1, addition_price: 0, flavors: [] },
            ],
          },
        ],
      };

      (window as any).COUPON_DICT = couponWithExcluded;
      (window as any).SINGLE_DICT = mockSingleDict;

      const { result } = renderHook(() => useCoupons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 糖醋醬不應計入原價
      expect(result.current.coupons[0].original_price).toBe(150);
    });
  });

  describe("錯誤處理", () => {
    it("當找不到項目時應該將原價設為 0", async () => {
      const couponWithUnknown: CouponDict = {
        ...mockCouponDict,
        coupon_list: [
          {
            ...mockCouponDict.coupon_list[0],
            items: [
              { name: "不存在的品項", count: 1, addition_price: 0, flavors: [] },
            ],
          },
        ],
      };

      (window as any).COUPON_DICT = couponWithUnknown;
      (window as any).SINGLE_DICT = mockSingleDict;

      const { result } = renderHook(() => useCoupons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coupons[0].original_price).toBe(0);
      expect(result.current.coupons[0].discount).toBe(10);
    });
  });

  describe("暱稱轉換", () => {
    it("應該將商品名稱轉換為標準暱稱並正確計算價格", async () => {
      const mockCouponDictWithNicknames: CouponDict = {
        coupon_list: [
          {
            name: "測試優惠券",
            product_code: "TEST002",
            coupon_code: 54321,
            items: [
              { name: "原味蛋撻超極酥", count: 2, addition_price: 0, flavors: [] },
            ],
            start_date: "2024-01-01",
            end_date: "2024-12-31",
            price: 50,
            original_price: 0,
            discount: 10,
          },
        ],
        coupon_by_code: {},
        count: 1,
        last_update: "2024-01-01",
      };

      const mockSingleDictWithEggs: SingleDict = {
        "原味蛋撻": { code: "E001", name: "原味蛋撻", price: 45, nutrition: "" },
      };

      (window as any).COUPON_DICT = mockCouponDictWithNicknames;
      (window as any).SINGLE_DICT = mockSingleDictWithEggs;

      const { result } = renderHook(() => useCoupons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const coupon = result.current.coupons[0];
      // 確保商品名稱已轉換為 "原味蛋撻"
      expect(coupon.items[0].name).toBe("原味蛋撻");
      // 確保原價計算正確 45 * 2 = 90
      expect(coupon.original_price).toBe(90);
    });
  });
});
