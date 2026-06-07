import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SearchPanel from "@/components/SearchPanel";
import CouponGrid from "@/components/CouponGrid";
import CompareBar from "@/components/CompareBar";
import CompareDialog from "@/components/CompareDialog";
import ScrollToTop from "@/components/ScrollToTop";
import { useCoupons } from "@/hooks/useCoupons";
import { useFavorites } from "@/hooks/useFavorites";
import { useTour } from "@/hooks/useTour";
import { useCouponFilters } from "@/hooks/useCouponFilters";
import { useCompare } from "@/hooks/useCompare";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedCode, setHighlightedCode] = useState<number | null>(null);
  const { coupons, count: couponCount, lastUpdate, isLoading, error } = useCoupons();
  const { startTour, shouldShowTour } = useTour();
  const {
    favorites,
    toggleFavorite,
    favoritesCount,
    cleanupInvalidFavorites,
    removedCoupons,
    clearRemovedCoupons,
  } = useFavorites();

  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    showFavoritesOnly,
    sortBy,
    setSortBy,
    searchAllOptions,
    setSearchAllOptions,
    priceRange,
    setPriceRange,
    priceStats,
    handleFilterToggle,
    handleFilterCountChange,
    handleClearFilters,
    handleToggleFavorites,
    filteredAndSortedCoupons,
  } = useCouponFilters(coupons, favorites);

  const {
    compareList,
    compareCount,
    toggleCompare,
    clearCompare,
    isDialogOpen: isCompareDialogOpen,
    setIsDialogOpen: setCompareDialogOpen,
  } = useCompare();

  // Check for invalid favorites when coupons are loaded
  useEffect(() => {
    if (coupons.length > 0) {
      const validCodes = new Set(coupons.map((c) => c.coupon_code));
      cleanupInvalidFavorites(validCodes);
    }
  }, [coupons, cleanupInvalidFavorites]);

  // Handle shared coupon link — filter to show only that coupon
  useEffect(() => {
    const couponParam = searchParams.get("coupon");
    if (couponParam && coupons.length > 0) {
      const code = Number(couponParam);
      setHighlightedCode(code);
      setSearchQuery(code.toString());
    }
  }, [coupons, searchParams, setSearchQuery]);

  // Auto-start tour for first-time visitors
  useEffect(() => {
    if (!isLoading && coupons.length > 0 && shouldShowTour()) {
      const timer = setTimeout(startTour, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, coupons.length, shouldShowTour, startTour]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入優惠券資料中...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p>載入優惠券資料失敗</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header lastUpdate={lastUpdate} />

      <main className="flex-1">
        <Hero couponCount={couponCount} />

        <SearchPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchAllOptions={searchAllOptions}
          onSearchAllOptionsChange={setSearchAllOptions}
          activeFilters={activeFilters}
          onFilterToggle={handleFilterToggle}
          onFilterCountChange={handleFilterCountChange}
          onClearAll={handleClearFilters}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={handleToggleFavorites}
          favoritesCount={favoritesCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={filteredAndSortedCoupons.length}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          priceStats={priceStats}
        />

        <section className="container py-6">
          <CouponGrid
            coupons={filteredAndSortedCoupons}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            compareList={compareList}
            onToggleCompare={toggleCompare}
            highlightedCode={highlightedCode}
          />
        </section>
      </main>

      <CompareBar
        compareList={compareList}
        coupons={filteredAndSortedCoupons}
        onRemove={toggleCompare}
        onClear={clearCompare}
        onCompare={() => setCompareDialogOpen(true)}
      />

      <CompareDialog
        open={isCompareDialogOpen}
        onOpenChange={setCompareDialogOpen}
        coupons={coupons}
        compareList={compareList}
      />

      <ScrollToTop offsetBottom={compareCount > 0} />

      {/* Invalid favorites removed dialog */}
      <AlertDialog open={removedCoupons.length > 0} onOpenChange={(open) => !open && clearRemovedCoupons()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>收藏已更新</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  以下 {removedCoupons.length} 張優惠券已過期或不再提供，已自動從收藏中移除：
                </p>
                <div className="max-h-32 overflow-y-auto rounded-md bg-muted p-2">
                  {removedCoupons.map((code) => (
                    <div key={code} className="text-sm font-mono">
                      優惠碼：{code}
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={clearRemovedCoupons}>
              我知道了
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
