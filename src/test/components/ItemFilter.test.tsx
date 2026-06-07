import { describe, it, expect } from "vitest";
import { itemFilters, filterMatchRules, type ItemFilterId } from "@/components/ItemFilter";

describe("filterMatchRules", () => {
  it("應該包含所有篩選器的規則", () => {
    itemFilters.forEach((filter) => {
      expect(filterMatchRules[filter.id]).toBeDefined();
    });
  });

  it("蛋撻規則應該包含正確的比對字串", () => {
    expect(filterMatchRules["蛋撻"]).toContain("原味蛋撻");
    expect(filterMatchRules["蛋撻"]).toContain("蛋撻");
    expect(filterMatchRules["蛋撻"]).toContain("原味蛋撻超極酥");
  });

  it("脆薯規則應該包含多種變體", () => {
    const rules = filterMatchRules["脆薯"];
    expect(rules).toContain("香酥脆薯");
    expect(rules).toContain("小薯");
    expect(rules).toContain("薯條");
  });

  it("漢堡類規則應該包含正確的品項", () => {
    expect(filterMatchRules["咔啦雞堡"]).toContain("咔啦雞腿堡");
    expect(filterMatchRules["花生熔岩雞腿堡"]).toContain("花生熔岩卡啦雞腿堡");
    expect(filterMatchRules["烤雞腿堡"]).toContain("紐奧良烙烤雞腿堡");
  });
});

describe("itemFilters", () => {
  it("應該有 14 個篩選項目", () => {
    expect(itemFilters.length).toBe(14);
  });

  it("每個篩選都應該有 id、label 和 emoji", () => {
    itemFilters.forEach((filter) => {
      expect(filter.id).toBeDefined();
      expect(filter.label).toBeDefined();
      expect(filter.emoji).toBeDefined();
    });
  });

  it("漢堡類應該使用 🍔 emoji", () => {
    const burgerFilters = itemFilters.filter((f) =>
      ["咔啦雞堡", "花生熔岩雞腿堡", "椒麻雞腿堡", "烤雞腿堡"].includes(f.id)
    );
    burgerFilters.forEach((filter) => {
      expect(filter.emoji).toBe("🍔");
    });
  });
});
