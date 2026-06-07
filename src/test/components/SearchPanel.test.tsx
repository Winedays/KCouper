import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent } from "@testing-library/dom";
import SearchPanel from "@/components/SearchPanel";
import { itemFilters, type ItemFilterId } from "@/components/ItemFilter";
import type { SortOption } from "@/components/SortSelect";
import type { ActiveFiltersMap } from "@/hooks/useCouponFilters";

describe("SearchPanel", () => {
  const defaultProps = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    searchAllOptions: false,
    onSearchAllOptionsChange: vi.fn(),
    activeFilters: {} as ActiveFiltersMap,
    onFilterToggle: vi.fn(),
    onFilterCountChange: vi.fn(),
    onClearAll: vi.fn(),
    showFavoritesOnly: false,
    onToggleFavorites: vi.fn(),
    favoritesCount: 0,
    sortBy: "discount" as SortOption,
    onSortChange: vi.fn(),
    resultCount: 100,
    priceRange: null as [number, number] | null,
    onPriceRangeChange: vi.fn(),
    priceStats: { min: 0, max: 500 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("搜尋輸入框", () => {
    it("應該渲染搜尋輸入框", () => {
      render(<SearchPanel {...defaultProps} />);
      expect(screen.getByPlaceholderText("搜尋優惠券或食品名稱...")).toBeInTheDocument();
    });

    it("應該顯示搜尋內容", () => {
      render(<SearchPanel {...defaultProps} searchQuery="炸雞" />);
      const input = screen.getByPlaceholderText("搜尋優惠券或食品名稱...") as HTMLInputElement;
      expect(input.value).toBe("炸雞");
    });

    it("輸入文字應該呼叫 onSearchChange", () => {
      const onSearchChange = vi.fn();
      render(<SearchPanel {...defaultProps} onSearchChange={onSearchChange} />);
      
      const input = screen.getByPlaceholderText("搜尋優惠券或食品名稱...");
      fireEvent.change(input, { target: { value: "蛋撻" } });
      
      expect(onSearchChange).toHaveBeenCalledWith("蛋撻");
    });

    it("有搜尋內容時應該顯示清除按鈕", () => {
      render(<SearchPanel {...defaultProps} searchQuery="測試" />);
      const clearButtons = screen.getAllByRole("button");
      const searchClearButton = clearButtons.find((btn) => 
        btn.querySelector('svg.lucide-x') && btn.closest('.relative')
      );
      expect(searchClearButton).toBeDefined();
    });
  });

  describe("搜尋所有選項", () => {
    it("應該渲染搜尋所有選項勾選框", () => {
      render(<SearchPanel {...defaultProps} />);
      expect(screen.getByText("搜尋所有選項")).toBeInTheDocument();
    });

    it("應該顯示勾選狀態", () => {
      render(<SearchPanel {...defaultProps} searchAllOptions={true} />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("點擊應該呼叫 onSearchAllOptionsChange", () => {
      const onSearchAllOptionsChange = vi.fn();
      render(<SearchPanel {...defaultProps} onSearchAllOptionsChange={onSearchAllOptionsChange} />);
      
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      
      expect(onSearchAllOptionsChange).toHaveBeenCalledWith(true);
    });
  });

  describe("餐點篩選器", () => {
    it("應該渲染所有餐點篩選按鈕", () => {
      render(<SearchPanel {...defaultProps} />);
      
      itemFilters.forEach((filter) => {
        expect(screen.getByText(filter.label)).toBeInTheDocument();
      });
    });

    it("點擊篩選按鈕應該呼叫 onFilterToggle", () => {
      const onFilterToggle = vi.fn();
      render(<SearchPanel {...defaultProps} onFilterToggle={onFilterToggle} />);
      
      fireEvent.click(screen.getByText("炸雞"));
      expect(onFilterToggle).toHaveBeenCalledWith("炸雞");
    });
  });

  describe("收藏篩選", () => {
    it("應該渲染收藏按鈕", () => {
      render(<SearchPanel {...defaultProps} />);
      expect(screen.getByText("收藏")).toBeInTheDocument();
    });

    it("點擊收藏按鈕應該呼叫 onToggleFavorites", () => {
      const onToggleFavorites = vi.fn();
      render(<SearchPanel {...defaultProps} onToggleFavorites={onToggleFavorites} />);
      
      fireEvent.click(screen.getByText("收藏"));
      expect(onToggleFavorites).toHaveBeenCalledTimes(1);
    });

    it("應該顯示收藏數量", () => {
      render(<SearchPanel {...defaultProps} favoritesCount={10} />);
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("應該渲染收藏說明 popover 觸發按鈕", () => {
      const { container } = render(<SearchPanel {...defaultProps} />);
      const infoButton = container.querySelector('.lucide-info');
      expect(infoButton).toBeInTheDocument();
    });
  });

  describe("清除篩選", () => {
    it("當有篩選時應該顯示清除按鈕", () => {
      render(<SearchPanel {...defaultProps} activeFilters={{ "蛋撻": 1 }} />);
      expect(screen.getByText("清除")).toBeInTheDocument();
    });

    it("當啟用收藏篩選時應該顯示清除按鈕", () => {
      render(<SearchPanel {...defaultProps} showFavoritesOnly={true} />);
      expect(screen.getByText("清除")).toBeInTheDocument();
    });

    it("當沒有篩選時不應該顯示清除按鈕", () => {
      render(<SearchPanel {...defaultProps} />);
      expect(screen.queryByText("清除")).not.toBeInTheDocument();
    });

    it("點擊清除按鈕應該呼叫 onClearAll", () => {
      const onClearAll = vi.fn();
      render(<SearchPanel {...defaultProps} activeFilters={{ "蛋撻": 1 }} onClearAll={onClearAll} />);
      
      fireEvent.click(screen.getByText("清除"));
      expect(onClearAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("結果計數", () => {
    it("應該顯示結果數量", () => {
      render(<SearchPanel {...defaultProps} resultCount={256} />);
      expect(screen.getByText("256")).toBeInTheDocument();
      expect(screen.getByText(/張優惠券/)).toBeInTheDocument();
    });

    it("應該正確顯示 0 個結果", () => {
      render(<SearchPanel {...defaultProps} resultCount={0} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("排序選擇", () => {
    it("應該渲染排序選擇器", () => {
      const { container } = render(<SearchPanel {...defaultProps} />);
      const sortTrigger = container.querySelector('[role="combobox"]');
      expect(sortTrigger).toBeInTheDocument();
    });
  });

  describe("價格區間篩選", () => {
    it("應該渲染價格快捷按鈕", () => {
      render(<SearchPanel {...defaultProps} />);
      expect(screen.getByText("$100以下")).toBeInTheDocument();
      expect(screen.getByText("$100-200")).toBeInTheDocument();
      expect(screen.getByText("$200以上")).toBeInTheDocument();
    });

    it("點擊快捷按鈕應呼叫 onPriceRangeChange", () => {
      const onPriceRangeChange = vi.fn();
      render(<SearchPanel {...defaultProps} onPriceRangeChange={onPriceRangeChange} />);
      
      fireEvent.click(screen.getByText("$100以下"));
      expect(onPriceRangeChange).toHaveBeenCalledWith([0, 100]);
    });

    it("價格篩選啟用時應顯示清除按鈕", () => {
      render(<SearchPanel {...defaultProps} priceRange={[0, 100]} />);
      expect(screen.getByText("清除")).toBeInTheDocument();
    });

    it("應該渲染自訂按鈕", () => {
      render(<SearchPanel {...defaultProps} />);
      expect(screen.getByText("自訂")).toBeInTheDocument();
    });
  });
});
