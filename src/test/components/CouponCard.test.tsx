import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent } from "@testing-library/dom";
import CouponCard from "@/components/CouponCard";
import type { Coupon } from "@/data/coupons";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CouponCard", () => {
  const mockCoupon: Coupon = {
    name: "超值雙人餐",
    product_code: "MEAL001",
    coupon_code: 12345,
    items: [
      { name: "原味雞", count: 2, addition_price: 0, flavors: [] },
      { name: "薯條", count: 1, addition_price: 0, flavors: [{ name: "大份", addition_price: 20 }] },
    ],
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    price: 199,
    original_price: 250,
    discount: 8.0,
  };

  const defaultProps = {
    coupon: mockCoupon,
    index: 0,
    favorites: new Set<number>(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("取餐方式標籤", () => {
    it("兩者皆適用時應顯示外送與自取", () => {
      render(<CouponCard {...defaultProps} coupon={{ ...mockCoupon, order_types: [1, 2] }} />);
      expect(screen.getByText("外送")).toBeInTheDocument();
      expect(screen.getByText("自取")).toBeInTheDocument();
    });

    it("只適用自取時只顯示自取", () => {
      render(<CouponCard {...defaultProps} coupon={{ ...mockCoupon, order_types: [2] }} />);
      expect(screen.getByText("自取")).toBeInTheDocument();
      expect(screen.queryByText("外送")).not.toBeInTheDocument();
    });

    it("沒有 order_types 時不顯示標籤", () => {
      render(<CouponCard {...defaultProps} />);
      expect(screen.queryByText("外送")).not.toBeInTheDocument();
      expect(screen.queryByText("自取")).not.toBeInTheDocument();
    });

    it("同時有用餐時段與取餐方式標籤時應顯示分隔線", () => {
      render(
        <CouponCard
          {...defaultProps}
          coupon={{ ...mockCoupon, meal_periods: [2], order_types: [1, 2] }}
        />
      );
      expect(screen.getByTestId("badge-divider")).toBeInTheDocument();
    });

    it("僅有一種標籤或無標籤時不應顯示分隔線", () => {
      const { rerender } = render(
        <CouponCard {...defaultProps} coupon={{ ...mockCoupon, meal_periods: [2] }} />
      );
      expect(screen.queryByTestId("badge-divider")).not.toBeInTheDocument();

      rerender(<CouponCard {...defaultProps} coupon={{ ...mockCoupon, order_types: [1] }} />);
      expect(screen.queryByTestId("badge-divider")).not.toBeInTheDocument();

      rerender(<CouponCard {...defaultProps} />);
      expect(screen.queryByTestId("badge-divider")).not.toBeInTheDocument();
    });
  });

  describe("渲染", () => {
    it("應該顯示優惠券名稱", () => {
      render(<CouponCard {...defaultProps} />);
      expect(screen.getByText("超值雙人餐")).toBeInTheDocument();
    });

    it("應該顯示優惠價格", () => {
      render(<CouponCard {...defaultProps} />);
      expect(screen.getByText("$199")).toBeInTheDocument();
    });

    it("應該顯示原價", () => {
      render(<CouponCard {...defaultProps} />);
      expect(screen.getByText("原價 $250")).toBeInTheDocument();
    });

    it("應該顯示折扣標籤", () => {
      render(<CouponCard {...defaultProps} />);
      expect(screen.getByText("8 折")).toBeInTheDocument();
    });

    it("應該顯示有效期限", () => {
      render(<CouponCard {...defaultProps} />);
      expect(screen.getByText("2024-01-01 ~ 2024-12-31")).toBeInTheDocument();
    });

    it("應該顯示品項列表", () => {
      render(<CouponCard {...defaultProps} />);
      expect(screen.getByText("原味雞 x 2")).toBeInTheDocument();
      expect(screen.getByText("薯條")).toBeInTheDocument();
    });
  });

  describe("原價為 0 的情況", () => {
    it("當原價為 0 時不應顯示折扣標籤", () => {
      const couponWithZeroPrice: Coupon = {
        ...mockCoupon,
        original_price: 0,
      };
      render(<CouponCard {...defaultProps} coupon={couponWithZeroPrice} />);
      expect(screen.queryByText(/折$/)).not.toBeInTheDocument();
    });

    it("當原價為 0 時不應顯示原價", () => {
      const couponWithZeroPrice: Coupon = {
        ...mockCoupon,
        original_price: 0,
      };
      render(<CouponCard {...defaultProps} coupon={couponWithZeroPrice} />);
      expect(screen.queryByText(/原價/)).not.toBeInTheDocument();
    });
  });

  describe("收藏功能", () => {
    it("應該顯示未收藏狀態", () => {
      render(<CouponCard {...defaultProps} />);
      const favoriteButton = screen.getByLabelText("加入收藏");
      expect(favoriteButton).toBeInTheDocument();
    });

    it("應該顯示已收藏狀態", () => {
      render(
        <CouponCard
          {...defaultProps}
          favorites={new Set([12345])}
        />
      );
      const favoriteButton = screen.getByLabelText("取消收藏");
      expect(favoriteButton).toBeInTheDocument();
    });

    it("點擊收藏按鈕應該呼叫 onToggleFavorite", () => {
      const onToggleFavorite = vi.fn();
      render(<CouponCard {...defaultProps} onToggleFavorite={onToggleFavorite} />);
      
      fireEvent.click(screen.getByLabelText("加入收藏"));
      expect(onToggleFavorite).toHaveBeenCalledWith(12345);
    });
  });

  describe("動畫延遲", () => {
    it("前 20 個卡片應該有動畫延遲", () => {
      const { container } = render(<CouponCard {...defaultProps} index={5} />);
      // Card is the first DOM element (Fragment doesn't render), style is on the Card element
      const card = container.firstElementChild as HTMLElement;
      expect(card).not.toBeNull();
      expect(card.style.animationDelay).toBe("250ms");
    });

    it("第 20 個以後的卡片不應該有動畫延遲", () => {
      const { container } = render(<CouponCard {...defaultProps} index={25} />);
      const card = container.firstElementChild as HTMLElement;
      expect(card).not.toBeNull();
      expect(card.style.animationDelay).toBe("0ms");
    });
  });

  describe("對話框", () => {
    it("點擊查看餐點選項應該開啟對話框", () => {
      render(<CouponCard {...defaultProps} />);
      
      fireEvent.click(screen.getByText("查看餐點選項"));
      
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
