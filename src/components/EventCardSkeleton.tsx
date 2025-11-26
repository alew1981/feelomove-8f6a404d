import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface EventCardSkeletonProps {
  viewMode?: "grid" | "list";
}

const EventCardSkeleton = ({ viewMode = "grid" }: EventCardSkeletonProps) => {
  return (
    <>
      {viewMode === "grid" ? (
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
      ) : (
        // List View Skeleton
        <Card className="overflow-hidden border-2 border-accent/20 shadow-lg animate-pulse">
          <div className="flex flex-row h-40">
            {/* Image Skeleton */}
            <Skeleton className="w-64 flex-shrink-0" />

            {/* Content Skeleton */}
            <div className="flex-1 flex items-center justify-between p-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>

              <Skeleton className="h-11 w-40" />
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default EventCardSkeleton;
