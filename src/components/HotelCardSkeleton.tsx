import { Skeleton } from "@/components/ui/skeleton";

/**
 * HotelCardSkeleton - Matches HotelCard dimensions exactly to prevent CLS
 * Height: 140px image + ~200px content = ~340px total on mobile
 * Uses shimmer animation for premium loading feel
 */
const HotelCardSkeleton = () => {
  return (
    <div className="rounded-lg shadow-lg bg-card overflow-hidden w-full">
      {/* Image skeleton - h-[140px] sm:h-[200px] matches HotelCard */}
      <Skeleton className="h-[140px] sm:h-[200px] w-full rounded-none" shimmer />

      {/* Hotel Details skeleton */}
      <div className="p-4 pb-2.5 space-y-2">
        {/* Stars */}
        <Skeleton className="h-4 w-20" shimmer />
        
        {/* Hotel Name - 2 lines */}
        <Skeleton className="h-5 w-full" shimmer />
        <Skeleton className="h-5 w-3/4" shimmer />
        
        {/* Address */}
        <Skeleton className="h-3 w-2/3" shimmer />
        
        {/* Distance */}
        <div className="pt-1">
          <Skeleton className="h-4 w-24" shimmer />
          <Skeleton className="h-3 w-32 mt-1" shimmer />
        </div>
        
        {/* Description */}
        <div className="pt-2.5 mt-2.5 border-t border-border">
          <Skeleton className="h-3 w-full" shimmer />
          <Skeleton className="h-3 w-5/6 mt-1" shimmer />
        </div>
      </div>

      {/* Footer with Price */}
      <div className="bg-muted p-3 sm:p-4 flex justify-end">
        <div className="text-right flex flex-col items-end w-full">
          <Skeleton className="h-8 w-16" shimmer />
          <Skeleton className="h-3 w-40 mt-1" shimmer />
          <Skeleton className="h-8 w-28 mt-2 rounded-lg" shimmer />
        </div>
      </div>
    </div>
  );
};

export default HotelCardSkeleton;
