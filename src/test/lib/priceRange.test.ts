import { describe, it, expect } from "vitest";
import { resolvePriceInput } from "@/lib/priceRange";

describe("resolvePriceInput", () => {
  const stats = { min: 50, max: 500 };
  const current: [number, number] = [100, 300];

  describe("合法輸入", () => {
    it("下限在範圍內應直接套用", () => {
      expect(resolvePriceInput("120", current, "min", stats)).toEqual([120, 300]);
    });

    it("上限在範圍內應直接套用", () => {
      expect(resolvePriceInput("250", current, "max", stats)).toEqual([100, 250]);
    });

    it("小數應四捨五入", () => {
      expect(resolvePriceInput("155.6", current, "max", stats)).toEqual([100, 156]);
    });

    it("前後空白應忽略", () => {
      expect(resolvePriceInput("  120  ", current, "min", stats)).toEqual([120, 300]);
    });
  });

  describe("超出範圍", () => {
    it("下限小於最小值應套用最小值", () => {
      expect(resolvePriceInput("20", current, "min", stats)).toEqual([50, 300]);
    });

    it("上限大於最大值應套用最大值", () => {
      expect(resolvePriceInput("999", current, "max", stats)).toEqual([100, 500]);
    });

    it("等於最小值應保留", () => {
      expect(resolvePriceInput("50", current, "min", stats)).toEqual([50, 300]);
    });

    it("等於最大值應保留", () => {
      expect(resolvePriceInput("500", current, "max", stats)).toEqual([100, 500]);
    });
  });

  describe("上限不可小於下限", () => {
    it("下限大於上限應改為等於上限", () => {
      expect(resolvePriceInput("400", current, "min", stats)).toEqual([300, 300]);
    });

    it("上限小於下限應改為等於下限", () => {
      expect(resolvePriceInput("80", current, "max", stats)).toEqual([100, 100]);
    });

    it("下限等於上限應允許", () => {
      expect(resolvePriceInput("300", current, "min", stats)).toEqual([300, 300]);
    });

    it("上限等於下限應允許", () => {
      expect(resolvePriceInput("100", current, "max", stats)).toEqual([100, 100]);
    });
  });

  describe("不合法輸入", () => {
    it("空字串應回傳 null", () => {
      expect(resolvePriceInput("", current, "min", stats)).toBeNull();
    });

    it("只有空白應回傳 null", () => {
      expect(resolvePriceInput("   ", current, "max", stats)).toBeNull();
    });

    it("非數字應回傳 null", () => {
      expect(resolvePriceInput("abc", current, "min", stats)).toBeNull();
    });
  });
});
