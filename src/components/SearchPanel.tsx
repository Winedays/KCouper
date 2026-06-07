import { useState } from "react";
import { Search, X, Heart, SlidersHorizontal, Info, DollarSign, ChevronDown, Plus, Minus } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { cn } from "@/lib/utils";
import { itemFilters, type ItemFilterId } from "./ItemFilter";
import { type ActiveFiltersMap } from "@/hooks/useCouponFilters";
import SortSelect, { type SortOption } from "./SortSelect";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

/** Price range quick-select presets */
const PRICE_PRESETS: { label: string; range: [number, number] }[] = [
  { label: "$100以下", range: [0, 100] },
  { label: "$100-200", range: [100, 200] },
  { label: "$200以上", range: [200, 9999] },
];

type SearchPanelProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchAllOptions: boolean;
  onSearchAllOptionsChange: (value: boolean) => void;
  activeFilters: ActiveFiltersMap;
  onFilterToggle: (filter: ItemFilterId) => void;
  onFilterCountChange: (filter: ItemFilterId, delta: number) => void;
  onClearAll: () => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  favoritesCount: number;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  resultCount: number;
  priceRange: [number, number] | null;
  onPriceRangeChange: (range: [number, number] | null) => void;
  priceStats: { min: number; max: number };
};

/**
 * Check if a price range matches a preset exactly
 */
const isPresetActive = (
  priceRange: [number, number] | null,
  preset: [number, number],
  maxPrice: number
): boolean => {
  if (!priceRange) return false;
  const effectivePresetMax = preset[1] === 9999 ? maxPrice : preset[1];
  const effectiveRangeMax = priceRange[1] === 9999 ? maxPrice : priceRange[1];
  return priceRange[0] === preset[0] && effectiveRangeMax === effectivePresetMax;
};

const SearchPanel = ({
  searchQuery,
  onSearchChange,
  searchAllOptions,
  onSearchAllOptionsChange,
  activeFilters,
  onFilterToggle,
  onFilterCountChange,
  onClearAll,
  showFavoritesOnly,
  onToggleFavorites,
  favoritesCount,
  sortBy,
  onSortChange,
  resultCount,
  priceRange,
  onPriceRangeChange,
  priceStats,
}: SearchPanelProps) => {
  const hasActiveFilters = Object.keys(activeFilters).length > 0 || showFavoritesOnly || priceRange !== null;

  /** Local slider state for the custom popover */
  const [sliderValue, setSliderValue] = useState<[number, number]>([priceStats.min, priceStats.max]);

  const handlePresetClick = (preset: [number, number]) => {
    const effectiveMax = preset[1] === 9999 ? priceStats.max : preset[1];
    if (isPresetActive(priceRange, preset, priceStats.max)) {
      onPriceRangeChange(null);
    } else {
      onPriceRangeChange([preset[0], effectiveMax]);
    }
  };

  const handleSliderCommit = (value: number[]) => {
    const [min, max] = value as [number, number];
    if (min === priceStats.min && max === priceStats.max) {
      onPriceRangeChange(null);
    } else {
      onPriceRangeChange([min, max]);
    }
  };

  const handlePopoverOpen = (open: boolean) => {
    if (open) {
      setSliderValue(priceRange ?? [priceStats.min, priceStats.max]);
    }
  };

  return (
    <div className="border-b border-border/50 bg-background">
      <div className="container py-4">
        {/* Search row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search input */}
          <div data-tour="search" className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜尋優惠券或食品名稱..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 bg-secondary/50 pl-9 pr-4 text-sm"
              aria-label="搜尋優惠券"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="清除搜尋"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search all options toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="search-all-options-panel"
              checked={searchAllOptions}
              onCheckedChange={(checked) => onSearchAllOptionsChange(checked === true)}
            />
            <Label
              htmlFor="search-all-options-panel"
              className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              搜尋所有選項
            </Label>
          </div>

          {/* Sort select */}
          <div data-tour="sort">
            <SortSelect value={sortBy} onChange={onSortChange} />
          </div>
        </div>

        {/* Filters row 1: Favorites + Item filters */}
        <div className="mt-4 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          
          <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Favorites filter */}
            <div data-tour="favorites" className="flex shrink-0 items-center gap-1">
              <button
                onClick={onToggleFavorites}
                aria-pressed={showFavoritesOnly}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  showFavoritesOnly
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
                <span>收藏</span>
                {favoritesCount > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    showFavoritesOnly
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}>
                    {favoritesCount}
                  </span>
                )}
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs text-center" side="bottom">
                  <p className="text-xs text-muted-foreground">
                    收藏功能會將資料儲存在瀏覽器的本地儲存空間中。如果換了裝置、清除瀏覽器資料或使用無痕模式，收藏記錄就會消失。
                  </p>
                </PopoverContent>
              </Popover>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-border shrink-0" />

            {/* Item filters with quantity controls */}
            <div data-tour="filters" className="flex items-center gap-2">
            {itemFilters.map((filter) => {
              const count = activeFilters[filter.id];
              const isActive = count !== undefined;
              return (
                <div key={filter.id} className="flex shrink-0 items-center">
                  <button
                    onClick={() => onFilterToggle(filter.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "rounded-l-full bg-primary text-primary-foreground shadow-sm px-3 py-1.5"
                        : "rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5"
                    )}
                  >
                    <span>{filter.emoji}</span>
                    <span>{filter.label}</span>
                    {isActive && count > 1 && (
                      <span className="text-[10px] font-bold opacity-80">x{count}</span>
                    )}
                  </button>
                  {isActive && (
                    <div className="inline-flex items-center self-stretch rounded-r-full bg-primary/90 text-primary-foreground">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterCountChange(filter.id, -1);
                        }}
                        className="flex w-6 items-center justify-center self-stretch hover:bg-primary-foreground/10 transition-colors"
                        aria-label={`減少${filter.label}數量`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[16px] text-center text-xs font-bold">{count}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterCountChange(filter.id, 1);
                        }}
                        className="flex w-6 items-center justify-center self-stretch rounded-r-full hover:bg-primary-foreground/10 transition-colors"
                        aria-label={`增加${filter.label}數量`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Filters row 2: Price range filters */}
        <div className="mt-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />

          <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div data-tour="price-filter" className="flex shrink-0 items-center gap-2">
              {PRICE_PRESETS.map((preset) => {
                const active = isPresetActive(priceRange, preset.range, priceStats.max);
                return (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.range)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}

              {/* Custom price range popover */}
              <Popover onOpenChange={handlePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      priceRange && !PRICE_PRESETS.some((p) => isPresetActive(priceRange, p.range, priceStats.max))
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    <span>自訂</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72" side="bottom" align="start">
                  <div className="space-y-4">
                    <p className="text-sm font-medium">自訂價格範圍</p>
                    <Slider
                      min={priceStats.min}
                      max={priceStats.max}
                      step={10}
                      value={sliderValue}
                      onValueChange={(v) => setSliderValue(v as [number, number])}
                      onValueCommit={handleSliderCommit}
                      minStepsBetweenThumbs={1}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>${sliderValue[0]}</span>
                      <span>${sliderValue[1]}</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200"
            >
              <X className="h-3 w-3" />
              <span>清除</span>
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-3 text-xs text-muted-foreground">
          共找到{" "}
          <span className="font-semibold text-foreground">{resultCount}</span>{" "}
          張優惠券
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
