import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent } from "@testing-library/dom";
import SortSelect, { type SortOption } from "@/components/SortSelect";

describe("SortSelect", () => {
  const defaultProps = {
    value: "price-asc" as SortOption,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染", () => {
    it("應該渲染排序選擇器", () => {
      const { container } = render(<SortSelect {...defaultProps} />);
      const trigger = container.querySelector('[role="combobox"]');
      expect(trigger).toBeInTheDocument();
    });

    it("應該渲染排序圖示", () => {
      const { container } = render(<SortSelect {...defaultProps} />);
      const icon = container.querySelector(".lucide-arrow-up-down");
      expect(icon).toBeInTheDocument();
    });

    it("應該顯示目前選取的排序選項", () => {
      render(<SortSelect {...defaultProps} value="price-asc" />);
      expect(screen.getByText("價格（低→高）")).toBeInTheDocument();
    });
  });

  describe("排序選項", () => {
    it("點擊觸發器應該開啟下拉選單", () => {
      render(<SortSelect {...defaultProps} />);

      const trigger = screen.getByRole("combobox");
      fireEvent.click(trigger);

      // Check that options are visible
      expect(screen.getByText("代碼（1→9）")).toBeInTheDocument();
      expect(screen.getByText("代碼（9→1）")).toBeInTheDocument();
      expect(screen.getByText("價格（高→低）")).toBeInTheDocument();
      expect(screen.getByText("折扣（高→低）")).toBeInTheDocument();
      expect(screen.getByText("折扣（低→高）")).toBeInTheDocument();
      expect(screen.getByText("到期日（近→遠）")).toBeInTheDocument();
      expect(screen.getByText("到期日（遠→近）")).toBeInTheDocument();
    });

    it("選擇選項應該呼叫 onChange", () => {
      const onChange = vi.fn();
      render(<SortSelect {...defaultProps} onChange={onChange} />);

      // Open dropdown
      const trigger = screen.getByRole("combobox");
      fireEvent.click(trigger);

      // Select an option
      fireEvent.click(screen.getByText("折扣（高→低）"));

      expect(onChange).toHaveBeenCalledWith("discount-desc");
    });
  });

  describe("各種排序值顯示", () => {
    const testCases: { value: SortOption; label: string }[] = [
      { value: "code-asc", label: "代碼（1→9）" },
      { value: "code-desc", label: "代碼（9→1）" },
      { value: "price-asc", label: "價格（低→高）" },
      { value: "price-desc", label: "價格（高→低）" },
      { value: "discount-desc", label: "折扣（高→低）" },
      { value: "discount-asc", label: "折扣（低→高）" },
      { value: "expiry-asc", label: "到期日（近→遠）" },
      { value: "expiry-desc", label: "到期日（遠→近）" },
    ];

    testCases.forEach(({ value, label }) => {
      it(`value="${value}" 應該顯示 "${label}"`, () => {
        render(<SortSelect {...defaultProps} value={value} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
