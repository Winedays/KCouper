import { Button } from "./ui/button";
import { GitCompareArrows, X, Trash2 } from "lucide-react";
import { type Coupon } from "@/data/coupons";

type CompareBarProps = {
  compareList: Set<number>;
  coupons: Coupon[];
  onRemove: (code: number) => void;
  onClear: () => void;
  onCompare: () => void;
};

/**
 * Floating bottom bar showing selected coupons for comparison
 */
const CompareBar = ({ compareList, coupons, onRemove, onClear, onCompare }: CompareBarProps) => {
  if (compareList.size === 0) return null;

  const selectedCoupons = coupons.filter((c) => compareList.has(c.coupon_code));

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md shadow-lg">
      <div className="container flex items-center gap-3 py-3">
        {/* Selected items */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          <GitCompareArrows className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex gap-2">
            {selectedCoupons.map((coupon) => (
              <div
                key={coupon.coupon_code}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                <span className="max-w-[100px] truncate">{coupon.name}</span>
                <button
                  onClick={() => onRemove(coupon.coupon_code)}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                  aria-label={`移除 ${coupon.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">清空</span>
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={onCompare}
            disabled={compareList.size < 2}
          >
            比較 ({compareList.size})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
