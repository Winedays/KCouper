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

type SortSelectProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
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

const SortSelect = ({ value, onChange }: SortSelectProps) => {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(val) => onChange(val as SortOption)}>
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="排序方式" />
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
  );
};

export default SortSelect;
