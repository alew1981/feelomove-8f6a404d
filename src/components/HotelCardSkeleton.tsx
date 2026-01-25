import { Skeleton } from "@/components/ui/skeleton";

/**
 * HotelCardSkeleton - Matches HotelCard dimensions exactly to prevent CLS
 * Height: 140px image + ~200px content = ~340px total on mobile
 */
const HotelCardSkeleton = () => {
  return (
    <div className="rounded-lg shadow-lg bg-card overflow-hidden w-full animate-pulse">
      {/* Image skeleton - h-[140px] sm:h-[200px] matches HotelCard */}
      <div className="h-[140px] sm:h-[200px] bg-muted" />

      {/* Hotel Details skeleton */}
      <div className="p-4 pb-2.5 space-y-2">
        {/* Stars */}
        <Skeleton className="h-4 w-20 rounded" />
        
        {/* Hotel Name - 2 lines */}
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-3/4 rounded" />
        
        {/* Address */}
        <Skeleton className="h-3 w-2/3 rounded" />
        
        {/* Distance */}
        <div className="pt-1">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-32 mt-1 rounded" />
        </div>
        
        {/* Description */}
        <div className="pt-2.5 mt-2.5 border-t border-border">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 mt-1 rounded" />
        </div>
      </div>

      {/* Footer with Price */}
      <div className="bg-muted p-3 sm:p-4 flex justify-end">
        <div className="text-right flex flex-col items-end w-full">
          <Skeleton className="h-8 w-16 rounded" />
          <Skeleton className="h-3 w-40 mt-1 rounded" />
          <Skeleton className="h-8 w-28 mt-2 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default HotelCardSkeleton;
