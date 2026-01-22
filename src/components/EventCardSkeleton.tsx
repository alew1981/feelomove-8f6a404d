import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const EventCardSkeleton = () => {
  return (
    <Card className="overflow-hidden border-2 border-accent/20 shadow-lg">
      <div className="flex flex-col">
        {/* Image Skeleton - exact height match */}
        <div className="relative h-56 bg-muted">
          {/* Badge skeleton - top left */}
          <div className="absolute left-2 top-0.5 z-20">
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          
          {/* Date Card Skeleton - matches real date card */}
          <div className="absolute left-2 top-8 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200" style={{ width: '85px' }}>
            <div className="text-center px-2 py-2 bg-gradient-to-b from-gray-50 to-white">
              <Skeleton className="h-2 w-10 mx-auto mb-1" />
              <Skeleton className="h-8 w-8 mx-auto my-1" />
              <Skeleton className="h-3 w-10 mx-auto mb-1" />
              <div className="border-t border-gray-200 pt-1.5 mt-1">
                <Skeleton className="h-4 w-12 mx-auto" />
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-2 w-14" />
              </div>
            </div>
          </div>

          
          {/* Category badge skeleton - bottom left */}
          <div className="absolute bottom-3 left-3">
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        </div>

        {/* Event Name Skeleton - matches text sizing */}
        <div className="bg-background px-4 pt-4 pb-2">
          <Skeleton className="h-6 w-full" />
        </div>

        {/* Button Skeleton - matches button height */}
        <div className="bg-background px-4 pb-4">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </Card>
  );
};

export default EventCardSkeleton;
