import { useState, useMemo, useCallback } from "react";
import { type Coupon } from "@/data/coupons";
import { type ItemFilterId, filterMatchRules } from "@/components/ItemFilter";
import { type SortOption, type SecondarySortOption } from "@/components/SortSelect";

/**
 * Active filters map: filter ID → minimum required count
 * @typedef {Partial<Record<ItemFilterId, number>>} ActiveFiltersMap
 */
export type ActiveFiltersMap = Partial<Record<ItemFilterId, number>>;

export type FilterState = { type: "include"; count: number } | { type: "exclude" };

/**
 * Compare two coupons based on a given sort option.
 */
export const compareCouponsByOption = (a: Coupon, b: Coupon, option: SortOption): number => {
  switch (option) {
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
};

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
  const [filterStates, setFilterStates] = useState<Record<ItemFilterId, FilterState>>({} as Record<ItemFilterId, FilterState>);
  
  // 衍生 activeFilters (維持原本的 Record<ItemFilterId, number> 型態)
  const activeFilters = useMemo(() => {
    const active: ActiveFiltersMap = {};
    for (const [id, state] of Object.entries(filterStates)) {
      if (state.type === "include") {
        active[id as ItemFilterId] = state.count;
      }
    }
    return active;
  }, [filterStates]);

  // 衍生 excludeFilters (維持原本的 Set<ItemFilterId> 型態)
  const excludeFilters = useMemo(() => {
    const excluded = new Set<ItemFilterId>();
    for (const [id, state] of Object.entries(filterStates)) {
      if (state.type === "exclude") {
        excluded.add(id as ItemFilterId);
      }
    }
    return excluded;
  }, [filterStates]);

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [primarySort, setPrimarySort] = useState<SortOption>("price-asc");
  const [secondarySort, setSecondarySort] = useState<SecondarySortOption>("none");

  const handlePrimarySortChange = useCallback((newPrimary: SortOption) => {
    const newCategory = newPrimary.split("-")[0];
    setSecondarySort((prev) => {
      if (prev !== "none" && prev.split("-")[0] === newCategory) {
        return "none";
      }
      return prev;
    });
    setPrimarySort(newPrimary);
  }, []);
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
    setFilterStates((prev) => {
      const current = prev[filter];
      const next = { ...prev };
      if (current?.type === "include") {
        next[filter] = { type: "exclude" };
      } else if (current?.type === "exclude") {
        delete next[filter];
      } else {
        next[filter] = { type: "include", count: 1 };
      }
      return next;
    });
  }, []);

  /** Adjust count for an active filter by delta (+1 or -1). Removes if count reaches 0. */
  const handleFilterCountChange = useCallback((filter: ItemFilterId, delta: number) => {
    setFilterStates((prev) => {
      const current = prev[filter];
      if (!current || current.type !== "include") return prev;
      const nextCount = current.count + delta;
      const next = { ...prev };
      if (nextCount <= 0) {
        delete next[filter];
      } else {
        next[filter] = { ...current, count: nextCount };
      }
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterStates({});
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

      // Exclude filters
      if (excludeFilters.size > 0) {
        const hasExcludedItem = coupon.items.some((item) => {
          return Array.from(excludeFilters).some((excludeFilter) => {
            const nameMatches = checkNameMatchesFilter(item.name, excludeFilter);
            const flavorMatches =
              searchAllOptions &&
              item.flavors?.some((flavor) => checkNameMatchesFilter(flavor.name, excludeFilter));
            return nameMatches || flavorMatches;
          });
        });
        if (hasExcludedItem) {
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
      const primaryResult = compareCouponsByOption(a, b, primarySort);
      if (primaryResult !== 0) return primaryResult;

      const primaryCategory = primarySort.split("-")[0];
      const secondaryCategory = secondarySort !== "none" ? secondarySort.split("-")[0] : null;

      if (secondarySort !== "none" && primaryCategory !== secondaryCategory) {
        const secondaryResult = compareCouponsByOption(a, b, secondarySort);
        if (secondaryResult !== 0) return secondaryResult;
      }

      return a.coupon_code - b.coupon_code;
    });
  }, [coupons, searchQuery, activeFilters, excludeFilters, showFavoritesOnly, favorites, primarySort, secondarySort, searchAllOptions, priceRange]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    excludeFilters,
    showFavoritesOnly,
    primarySort,
    setPrimarySort: handlePrimarySortChange,
    secondarySort,
    setSecondarySort,
    sortBy: primarySort,
    setSortBy: handlePrimarySortChange,
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
