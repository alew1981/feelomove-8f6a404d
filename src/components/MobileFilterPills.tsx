import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface MobileFilterPillsProps {
  filters: FilterConfig[];
  onClearAll: () => void;
}

const MobileFilterPills = memo(({ filters, onClearAll }: MobileFilterPillsProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFilters = filters.filter(f => f.value !== "all");
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-2",
                "rounded-full border-2 text-sm font-medium",
                "transition-all duration-200",
                hasActiveFilters 
                  ? "border-accent bg-accent/10 text-accent" 
                  : "border-border bg-card text-foreground hover:border-muted-foreground/50"
              )}
            >
              <Filter className="h-4 w-4" />
              <span>{t("Filtros")}</span>
              {hasActiveFilters && (
                <span className="ml-0.5 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left">{t("Filtros")}</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4 pb-6">
              {filters.map((filter) => (
                <div key={filter.id} className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {filter.label}
                  </label>
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger className="w-full h-12 bg-card border-2 border-border rounded-lg">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("Todos")}</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              <div className="flex gap-2 pt-4">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      onClearAll();
                      setIsOpen(false);
                    }}
                  >
                    {t("Limpiar")}
                  </Button>
                )}
                <Button
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  {t("Aplicar")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 min-w-max">
              {activeFilters.map((filter) => {
                const selectedOption = filter.options.find(o => o.value === filter.value);
                return (
                  <button
                    key={filter.id}
                    onClick={() => filter.onChange("all")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5",
                      "rounded-full border border-accent/30 bg-accent/10",
                      "text-xs font-medium text-accent",
                      "transition-all duration-200",
                      "hover:bg-accent/20 active:scale-95"
                    )}
                  >
                    <span className="truncate max-w-[100px]">
                      {selectedOption?.label || filter.value}
                    </span>
                    <X className="h-3 w-3 flex-shrink-0" />
                  </button>
                );
              })}
              
              <button
                onClick={onClearAll}
                className="text-xs text-muted-foreground hover:text-destructive underline whitespace-nowrap ml-1"
              >
                {t("Limpiar todo")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MobileFilterPills.displayName = "MobileFilterPills";

export default MobileFilterPills;
