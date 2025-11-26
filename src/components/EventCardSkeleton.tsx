import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const EventCardSkeleton = () => {
  return (
    <Card className="overflow-hidden border-2 border-accent/20 shadow-lg animate-pulse">
      <div className="flex flex-col">
        {/* Image Skeleton */}
        <div className="relative h-56 bg-muted">
          {/* Date Card Skeleton */}
          <div className="absolute left-2 top-3 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200" style={{ width: '85px' }}>
            <div className="text-center px-2 py-2">
              <Skeleton className="h-2 w-12 mx-auto mb-1" />
              <Skeleton className="h-8 w-10 mx-auto my-1" />
              <Skeleton className="h-2 w-10 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto mt-2" />
              <Skeleton className="h-2 w-16 mx-auto mt-1" />
            </div>
          </div>

          {/* Countdown Skeleton */}
          <div className="absolute top-3 right-3">
            <div className="bg-black/90 backdrop-blur-md rounded-md px-3 py-2">
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>

        {/* Event Name Skeleton */}
        <div className="bg-background px-4 pt-4 pb-2">
          <Skeleton className="h-5 w-full" />
        </div>

        {/* Button Skeleton */}
        <div className="bg-background px-4 pb-4">
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </Card>
  );
};

export default EventCardSkeleton;
