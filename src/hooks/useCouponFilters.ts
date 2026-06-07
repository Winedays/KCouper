import { useState, useMemo, useCallback } from "react";
import { type Coupon } from "@/data/coupons";
import { type ItemFilterId, filterMatchRules } from "@/components/ItemFilter";
import { type SortOption } from "@/components/SortSelect";

/**
 * Active filters map: filter ID → minimum required count
 * @typedef {Partial<Record<ItemFilterId, number>>} ActiveFiltersMap
 */
export type ActiveFiltersMap = Partial<Record<ItemFilterId, number>>;

/**
 * Check if a name matches a filter using the filterMatchRules
 * @param name - The name to check
 * @param filter - The filter ID to match against
 * @returns True if the name matches any of the filter's match rules
 */
const checkNameMatchesFilter = (name: string, filter: ItemFilterId): boolean => {
  const matchPatterns = filterMatchRules[filter];
  if (!matchPatterns) return false;
  return matchPatterns.some((pattern) => name.includes(pattern));
};

export const useCouponFilters = (coupons: Coupon[], favorites: Set<number>) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFiltersMap>({});
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("price-asc");
  const [searchAllOptions, setSearchAllOptions] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  /** Min and max price across all coupons, for Slider bounds */
  const priceStats = useMemo(() => {
    if (coupons.length === 0) return { min: 0, max: 500 };
    const prices = coupons.map((c) => c.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [coupons]);

  /** Toggle a filter on/off (sets count to 1 when enabling) */
  const handleFilterToggle = useCallback((filter: ItemFilterId) => {
    setActiveFilters((prev) => {
      if (filter in prev) {
        const next = { ...prev };
        delete next[filter];
        return next;
      }
      return { ...prev, [filter]: 1 };
    });
  }, []);

  /** Adjust count for an active filter by delta (+1 or -1). Removes if count reaches 0. */
  const handleFilterCountChange = useCallback((filter: ItemFilterId, delta: number) => {
    setActiveFilters((prev) => {
      const current = prev[filter] ?? 0;
      const next = current + delta;
      if (next <= 0) {
        const updated = { ...prev };
        delete updated[filter];
        return updated;
      }
      return { ...prev, [filter]: next };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters({});
    setShowFavoritesOnly(false);
    setPriceRange(null);
  }, []);

  const handleToggleFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev);
  }, []);

  const filteredAndSortedCoupons = useMemo(() => {
    const filterEntries = Object.entries(activeFilters) as [ItemFilterId, number][];

    const filtered = coupons.filter((coupon) => {
      // Favorites filter
      if (showFavoritesOnly && !favorites.has(coupon.coupon_code)) {
        return false;
      }

      // Price range filter
      if (priceRange) {
        if (coupon.price < priceRange[0] || coupon.price > priceRange[1]) {
          return false;
        }
      }

      // Item filters with quantity check
      const matchesFilter =
        filterEntries.length === 0 ||
        filterEntries.every(([filter, minCount]) => {
          // Sum up count of all matching items
          const totalCount = coupon.items.reduce((sum, item) => {
            const nameMatches = checkNameMatchesFilter(item.name, filter);
            const flavorMatches = searchAllOptions && item.flavors?.some(
              (flavor) => checkNameMatchesFilter(flavor.name, filter)
            );
            return sum + (nameMatches || flavorMatches ? item.count : 0);
          }, 0);
          return totalCount >= minCount;
        });

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        coupon.name.toLowerCase().includes(searchLower) ||
        coupon.items.some((item) => item.name.toLowerCase().includes(searchLower)) ||
        coupon.coupon_code.toString().includes(searchLower) ||
        
        (searchAllOptions && coupon.items.some((item) =>
          item.flavors?.some((flavor) => flavor.name.toLowerCase().includes(searchLower))
        ));

      return matchesFilter && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "code-asc":
          return a.coupon_code - b.coupon_code;
        case "code-desc":
          return b.coupon_code - a.coupon_code;
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "discount-desc":
          return a.discount - b.discount;
        case "discount-asc":
          return b.discount - a.discount;
        case "expiry-asc":
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case "expiry-desc":
          return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
        default:
          return 0;
      }
    });
  }, [coupons, searchQuery, activeFilters, showFavoritesOnly, favorites, sortBy, searchAllOptions, priceRange]);

  return {
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
  };
};
