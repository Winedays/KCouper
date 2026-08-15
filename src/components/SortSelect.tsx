import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOption =
  | "code-asc"
  | "code-desc"
  | "price-asc"
  | "price-desc"
  | "discount-asc"
  | "discount-desc"
  | "expiry-asc"
  | "expiry-desc";

export type SecondarySortOption = "none" | SortOption;

type SortSelectProps = {
  primaryValue?: SortOption;
  onPrimaryChange?: (value: SortOption) => void;
  secondaryValue?: SecondarySortOption;
  onSecondaryChange?: (value: SecondarySortOption) => void;

  // Backward compatibility
  value?: SortOption;
  onChange?: (value: SortOption) => void;
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "code-asc", label: "代碼（1→9）" },
  { value: "code-desc", label: "代碼（9→1）" },
  { value: "price-asc", label: "價格（低→高）" },
  { value: "price-desc", label: "價格（高→低）" },
  { value: "discount-desc", label: "折扣（高→低）" },
  { value: "discount-asc", label: "折扣（低→高）" },
  { value: "expiry-asc", label: "到期日（近→遠）" },
  { value: "expiry-desc", label: "到期日（遠→近）" },
];

const secondarySortOptions: { value: SecondarySortOption; label: string }[] = [
  { value: "none", label: "無 (不使用次要排序)" },
  ...sortOptions,
];

const SortSelect = ({
  primaryValue,
  onPrimaryChange,
  secondaryValue = "none",
  onSecondaryChange,
  value,
  onChange,
}: SortSelectProps) => {
  const currentPrimary = primaryValue ?? value ?? "price-asc";
  const handlePrimaryChange = (val: SortOption) => {
    const newCategory = val.split("-")[0];
    const secondaryCategory = currentSecondary !== "none" ? currentSecondary.split("-")[0] : null;

    if (newCategory === secondaryCategory && onSecondaryChange) {
      onSecondaryChange("none");
    }

    if (onPrimaryChange) {
      onPrimaryChange(val);
    }
    if (onChange) {
      onChange(val);
    }
  };

  const currentSecondary = secondaryValue;
  const handleSecondaryChange = (val: SecondarySortOption) => {
    if (onSecondaryChange) {
      onSecondaryChange(val);
    }
  };

  const primaryCategory = currentPrimary.split("-")[0];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={currentPrimary} onValueChange={(val) => handlePrimaryChange(val as SortOption)}>
          <SelectTrigger className="w-[150px] bg-background">
            <SelectValue placeholder="主排序方式" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="pl-3 [&>span:first-child]:hidden">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">次要排序：</span>
        <Select value={currentSecondary} onValueChange={(val) => handleSecondaryChange(val as SecondarySortOption)}>
          <SelectTrigger className="w-[165px] bg-background">
            <SelectValue placeholder="當主排序相同時..." />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {secondarySortOptions.map((option) => {
              const isCategoryMatch =
                option.value !== "none" && option.value.split("-")[0] === primaryCategory;
              return (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={isCategoryMatch}
                  className="pl-3 [&>span:first-child]:hidden"
                >
                  {option.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SortSelect;
