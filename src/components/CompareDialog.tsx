import { type Coupon } from "@/data/coupons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ExternalLink, Calendar } from "lucide-react";

type CompareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupons: Coupon[];
  compareList: Set<number>;
};

/**
 * Format item display with count
 */
const formatItemDisplay = (name: string, count: number) => {
  return count === 1 ? name : `${name} x ${count}`;
};

/**
 * Mobile card layout for a single coupon
 */
const CouponCompareCard = ({ coupon }: { coupon: Coupon }) => (
  <div className="rounded-lg border border-border p-4 space-y-3">
    <h3 className="font-bold text-foreground text-base">{coupon.name}</h3>

    <div className="flex items-baseline gap-3">
      <span className="text-xl font-black text-gradient">${coupon.price}</span>
      {coupon.original_price > 0 && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            ${coupon.original_price}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
            {coupon.discount} 折
          </span>
        </>
      )}
    </div>

    {coupon.original_price > 0 && (
      <p className="text-sm font-medium text-green-600 dark:text-green-400">
        省下 ${coupon.original_price - coupon.price}
      </p>
    )}

    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">品項</p>
      {coupon.items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 text-sm">
          <span className="h-1 w-1 rounded-full bg-primary/60" />
          <span>{formatItemDisplay(item.name, item.count)}</span>
        </div>
      ))}
    </div>

    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Calendar className="h-3.5 w-3.5" />
      <span>{coupon.start_date} ~ {coupon.end_date}</span>
    </div>

    <Button variant="hero" size="sm" className="w-full" asChild>
      <a
        href={`https://www.kfcclub.com.tw/meal/${coupon.product_code}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5"
      >
        <span>前往點餐</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </Button>
  </div>
);

/**
 * Dialog showing side-by-side coupon comparison table (desktop)
 * and vertical card layout (mobile)
 */
const CompareDialog = ({ open, onOpenChange, coupons, compareList }: CompareDialogProps) => {
  const selectedCoupons = coupons.filter((c) => compareList.has(c.coupon_code));

  if (selectedCoupons.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">優惠券比較</DialogTitle>
        </DialogHeader>

        {/* Mobile: card layout */}
        <div className="block md:hidden p-4 pt-2 space-y-3">
          {selectedCoupons.map((c) => (
            <CouponCompareCard key={c.coupon_code} coupon={c} />
          ))}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden md:block overflow-x-auto p-6 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 text-left font-medium text-muted-foreground w-24">項目</th>
                {selectedCoupons.map((c) => (
                  <th key={c.coupon_code} className="py-3 px-3 text-left font-bold text-foreground">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4 font-medium text-muted-foreground">優惠價</td>
                {selectedCoupons.map((c) => (
                  <td key={c.coupon_code} className="py-3 px-3">
                    <span className="text-lg font-black text-gradient">${c.price}</span>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4 font-medium text-muted-foreground">原價</td>
                {selectedCoupons.map((c) => (
                  <td key={c.coupon_code} className="py-3 px-3 text-muted-foreground line-through">
                    {c.original_price > 0 ? `$${c.original_price}` : "-"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4 font-medium text-muted-foreground">折扣</td>
                {selectedCoupons.map((c) => (
                  <td key={c.coupon_code} className="py-3 px-3">
                    {c.original_price > 0 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {c.discount} 折
                      </span>
                    ) : "-"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4 font-medium text-muted-foreground">省下</td>
                {selectedCoupons.map((c) => (
                  <td key={c.coupon_code} className="py-3 px-3 font-medium text-green-600 dark:text-green-400">
                    {c.original_price > 0 ? `$${c.original_price - c.price}` : "-"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4 align-top font-medium text-muted-foreground">品項</td>
                {selectedCoupons.map((c) => (
                  <td key={c.coupon_code} className="py-3 px-3 align-top">
                    <div className="space-y-1">
                      {c.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-sm">
                          <span className="h-1 w-1 rounded-full bg-primary/60" />
                          <span>{formatItemDisplay(item.name, item.count)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4 font-medium text-muted-foreground">期限</td>
                {selectedCoupons.map((c) => (
                  <td key={c.coupon_code} className="py-3 px-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{c.start_date} ~ {c.end_date}</span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-muted-foreground">點餐</td>
                {selectedCoupons.map((c) => (
                  <td key={c.coupon_code} className="py-3 px-3">
                    <Button variant="hero" size="sm" asChild>
                      <a
                        href={`https://www.kfcclub.com.tw/meal/${c.product_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5"
                      >
                        <span>前往點餐</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompareDialog;
