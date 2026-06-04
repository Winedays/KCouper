import { type Coupon } from "@/data/coupons";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, ExternalLink, ChefHat, ArrowRightLeft, Heart } from "lucide-react";
import { useState, memo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

type CouponCardProps = {
  coupon: Coupon;
  index: number;
  favorites: Set<number>;
  onToggleFavorite: (id: number) => void;
  isFirstCard?: boolean;
};

const CouponCard = ({ coupon, index, favorites, onToggleFavorite, isFirstCard = false }: CouponCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isFavorite = favorites.has(coupon.coupon_code);

  const handleToggleFavorite = () => {
    onToggleFavorite(coupon.coupon_code);
    toast.success(isFavorite ? "已取消收藏" : "已加入收藏");
  };

  const savings = coupon.original_price - coupon.price;

  const hasAnyFlavors = coupon.items.some(
    (item) => item.flavors && item.flavors.length > 0
  );

  // Format item display with count
  const formatItemDisplay = (name: string, count: number) => {
    if (count === 1) return name;
    return `${name} x ${count}`;
  };

  return (
    <>
      <Card
        data-tour={isFirstCard ? "coupon-card" : undefined}
        className="group relative flex h-full flex-col overflow-hidden border-border/60 bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
        style={{
          animationDelay: index < 20 ? `${index * 50}ms` : '0ms',
        }}
      >
        {/* Discount badge - only show when original_price > 0 */}
        {coupon.original_price > 0 && (
          <div className="absolute -right-8 top-4 rotate-45">
            <div className="bg-gradient-primary px-10 py-1 text-xs font-bold text-primary-foreground shadow-md">
              {coupon.discount} 折
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col p-5">
          {/* Title with favorite button */}
          <div className="mb-3 flex items-start gap-2">
            <button
              onClick={handleToggleFavorite}
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all hover:scale-110"
              aria-label={isFavorite ? "取消收藏" : "加入收藏"}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary/60"
                  }`}
              />
            </button>
            <h3 className="text-lg font-bold leading-snug text-foreground pr-8">
              {coupon.name}
            </h3>
          </div>

          {/* Items list */}
          <div className="mb-4 space-y-1">
            {coupon.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                <span>{formatItemDisplay(item.name, item.count)}</span>
              </div>
            ))}
          </div>

          {/* Spacer to push bottom content */}
          <div className="flex-1" />

          {/* Price & validity row */}
          <div className="flex items-center gap-3 border-t border-border/50 pt-4">
            <p className="text-xl font-black text-gradient">
              ${coupon.price}
            </p>
            {coupon.original_price > 0 && (
              <p className="text-sm text-muted-foreground line-through">
                原價 ${coupon.original_price}
              </p>
            )}
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{coupon.start_date} ~ {coupon.end_date}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 py-2 sm:py-0"
              onClick={() => setIsDialogOpen(true)}
            >
              <ChefHat className="h-4 w-4 mr-2" />
              查看餐點選項
            </Button>

            <Button
              variant="hero"
              size="sm"
              className="flex-1 py-2 sm:py-0"
              asChild
            >
              <a
                href={`https://www.kfcclub.com.tw/meal/${coupon.product_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <span>前往點餐</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </Card>

      {/* Options Dialog - lazy rendered */}
      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{coupon.name}</DialogTitle>
              <DialogDescription asChild>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-2xl font-black text-gradient">${coupon.price}</span>
                  <span className="text-sm text-muted-foreground line-through">原價 ${coupon.original_price}</span>
                </div>
              </DialogDescription>
            </DialogHeader>

            {/* Order button at top */}
            <div className="mt-4">
              <Button
                variant="hero"
                className="w-full"
                asChild
              >
                <a
                  href={`https://www.kfcclub.com.tw/meal/${coupon.product_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <span>前往點餐</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Price reminder */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  💡 品項價格為一件的價錢
                </p>
              </div>

              {/* Items with flavors */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  可更換口味
                </h4>

                {!hasAnyFlavors ? (
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-muted-foreground">沒有可以更換的品項</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coupon.items.map((item, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <p className="font-medium text-foreground mb-2">
                          {formatItemDisplay(item.name, item.count)}
                          {item.addition_price > 0 && (
                            <span className="ml-2 text-sm text-primary">+${item.addition_price}</span>
                          )}
                        </p>
                        {item.flavors && item.flavors.length > 0 ? (
                          <div className="space-y-1.5">
                            {item.flavors.map((flavor, j) => (
                              <div
                                key={j}
                                className="flex items-center justify-between text-sm bg-secondary/50 rounded-md px-3 py-1.5"
                              >
                                <span className="text-secondary-foreground">
                                  → {flavor.name}
                                </span>
                                <span className={`font-medium ${flavor.addition_price === 0 ? 'text-green-600' : 'text-primary'}`}>
                                  {flavor.addition_price === 0 ? '免費' : `+$${flavor.addition_price}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">無可更換選項</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default memo(CouponCard, (prev, next) => {
  return (
    prev.coupon.coupon_code === next.coupon.coupon_code &&
    prev.index === next.index &&
    prev.isFirstCard === next.isFirstCard &&
    prev.favorites.has(prev.coupon.coupon_code) === next.favorites.has(next.coupon.coupon_code) &&
    prev.onToggleFavorite === next.onToggleFavorite
  );
});
