import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent, within } from "@testing-library/dom";
import SortSelect, { type SortOption, type SecondarySortOption } from "@/components/SortSelect";

describe("SortSelect", () => {
  const multiProps = {
    primaryValue: "price-asc" as SortOption,
    onPrimaryChange: vi.fn(),
    secondaryValue: "discount-desc" as SecondarySortOption,
    onSecondaryChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("多條件排序渲染與互動", () => {
    it("應該同時渲染主排序與次排序下拉選單", () => {
      render(<SortSelect {...multiProps} />);
      const triggers = screen.getAllByRole("combobox");
      expect(triggers.length).toBe(2);
    });

    it("當次要排序分類與主要排序相同時，次要排序中該分類選項應被禁用", () => {
      render(
        <SortSelect
          primaryValue="price-asc"
          onPrimaryChange={vi.fn()}
          secondaryValue="none"
          onSecondaryChange={vi.fn()}
        />
      );
      const triggers = screen.getAllByRole("combobox");
      fireEvent.click(triggers[1]);

      const listbox = screen.getByRole("listbox");

      const priceAscOption = within(listbox).getByText("價格（低→高）").closest('[role="option"]');
      const priceDescOption = within(listbox).getByText("價格（高→低）").closest('[role="option"]');

      expect(priceAscOption).toHaveAttribute("data-disabled");
      expect(priceDescOption).toHaveAttribute("data-disabled");

      const discountDescOption = within(listbox).getByText("折扣（高→低）").closest('[role="option"]');
      expect(discountDescOption).not.toHaveAttribute("data-disabled");
    });
  });

  describe("單一/相容模式", () => {
    it("僅傳入 value/onChange 時亦能相容運作", () => {
      const onChange = vi.fn();
      render(<SortSelect value="price-asc" onChange={onChange} />);

      const triggers = screen.getAllByRole("combobox");
      expect(triggers.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(triggers[0]);

      const listbox = screen.getByRole("listbox");
      fireEvent.click(within(listbox).getByText("折扣（高→低）"));

      expect(onChange).toHaveBeenCalledWith("discount-desc");
    });
  });
});
