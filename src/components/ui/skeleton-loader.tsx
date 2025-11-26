import { Skeleton } from "./skeleton";
import { Card, CardContent } from "./card";

export const EventCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-64 w-full rounded-t-lg" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
};

export const ArtistCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-64 w-full" />
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-11 w-full" />
      </CardContent>
    </Card>
  );
};

export const DestinationCardSkeleton = () => {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-6 w-40" />
        <div className="pt-4 border-t space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-11 w-full" />
      </CardContent>
    </Card>
  );
};
