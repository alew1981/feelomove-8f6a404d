import { Skeleton } from "./skeleton";
import { Card, CardContent } from "./card";

export const EventCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card border-2 border-accent/20 shadow-lg">
      {/* Match exact dimensions of EventCard: h-56 = 224px */}
      <div className="relative h-56 bg-muted animate-pulse">
        {/* Date card placeholder - matches real position */}
        <div className="absolute left-2 top-8 bg-muted-foreground/20 rounded-lg w-[85px] h-[100px]" />
        {/* Category badge placeholder */}
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-5 w-16 rounded-md bg-muted-foreground/20" />
        </div>
        {/* VIP/Countdown placeholder */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-8 w-20 rounded-md bg-muted-foreground/30" />
        </div>
      </div>
      {/* Event name area */}
      <div className="bg-background px-4 pt-4 pb-2">
        <Skeleton className="h-6 w-4/5 bg-muted-foreground/20" />
      </div>
      {/* Button area */}
      <div className="bg-background px-4 pb-4">
        <Skeleton className="h-12 w-full rounded-lg bg-accent/30" />
      </div>
    </Card>
  );
};

export const ArtistCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card border-border/50">
      {/* Match exact dimensions of real card: h-64 = 256px */}
      <div className="relative h-64 bg-muted animate-pulse">
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-20 rounded-md bg-muted-foreground/30" />
        </div>
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-5 w-16 rounded-md bg-muted-foreground/20" />
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4 bg-muted-foreground/20" />
        <Skeleton className="h-4 w-20 bg-muted-foreground/15" />
      </CardContent>
      <div className="p-4 pt-0">
        <Skeleton className="h-10 w-full rounded-lg bg-accent/30" />
      </div>
    </Card>
  );
};

export const DestinationCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card border-border/50">
      {/* Match exact dimensions of real card: h-64 = 256px */}
      <div className="relative h-64 bg-muted animate-pulse">
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-20 rounded-md bg-muted-foreground/30" />
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4 bg-muted-foreground/20" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-24 bg-muted-foreground/15" />
          <Skeleton className="h-4 w-20 bg-muted-foreground/15" />
        </div>
        <Skeleton className="h-4 w-20 bg-accent/30" />
      </CardContent>
      <div className="p-4 pt-0">
        <Skeleton className="h-10 w-full rounded-lg bg-accent/30" />
      </div>
    </Card>
  );
};

export const FestivalCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card border-2 border-accent/20 shadow-lg">
      {/* Match exact dimensions of FestivalCard: h-56 = 224px */}
      <div className="relative h-56 bg-muted animate-pulse">
        {/* Availability badge placeholder */}
        <div className="absolute left-2 top-0.5 z-20">
          <Skeleton className="h-5 w-20 rounded bg-muted-foreground/30" />
        </div>
        {/* Date card placeholder - matches real position */}
        <div className="absolute left-2 top-8 bg-muted-foreground/20 rounded-lg" style={{ minWidth: '90px', height: '90px' }} />
        {/* Entry type badge placeholder */}
        <div className="absolute bottom-2 right-2">
          <Skeleton className="h-5 w-24 rounded bg-accent/40" />
        </div>
      </div>
      {/* Title area */}
      <div className="bg-background px-4 pt-4 pb-2">
        <Skeleton className="h-6 w-4/5 bg-muted-foreground/20" />
        <Skeleton className="h-4 w-2/5 mt-1 bg-muted-foreground/15" />
      </div>
      {/* Button area */}
      <div className="bg-background px-4 pb-4">
        <Skeleton className="h-12 w-full rounded-lg bg-accent/30" />
      </div>
    </Card>
  );
};

export const GenreCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card border-2 border-border/50">
      {/* Match exact dimensions of real card: h-64 = 256px */}
      <div className="relative h-64 bg-muted animate-pulse">
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-20 rounded-md bg-muted-foreground/30" />
        </div>
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-5 w-16 rounded-md bg-muted-foreground/20" />
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4 bg-muted-foreground/20" />
        <Skeleton className="h-4 w-full bg-muted-foreground/15" />
        <Skeleton className="h-4 w-20 bg-accent/30" />
      </CardContent>
      <div className="p-4 pt-0">
        <Skeleton className="h-10 w-full rounded-lg bg-accent/30" />
      </div>
    </Card>
  );
};

export const HeroSkeleton = () => {
  return (
    <div className="relative min-h-[70vh] bg-muted animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-4xl px-4">
          <Skeleton className="h-16 w-96 mx-auto bg-muted-foreground/20" />
          <Skeleton className="h-8 w-80 mx-auto bg-muted-foreground/15" />
          <Skeleton className="h-14 w-full max-w-2xl mx-auto rounded-2xl bg-muted-foreground/20" />
        </div>
      </div>
    </div>
  );
};

export const ProductHeroSkeleton = () => {
  return (
    <div className="relative aspect-[16/9] md:aspect-[21/9] bg-muted animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      {/* Date card skeleton */}
      <div className="absolute bottom-6 left-6">
        <Skeleton className="h-24 w-20 rounded-xl bg-muted-foreground/30" />
      </div>
      {/* Event info skeleton */}
      <div className="absolute top-6 right-6 space-y-2 text-right">
        <Skeleton className="h-10 w-64 ml-auto bg-muted-foreground/30" />
        <Skeleton className="h-6 w-48 ml-auto bg-muted-foreground/20" />
      </div>
      {/* Countdown skeleton */}
      <div className="absolute top-6 left-6">
        <Skeleton className="h-8 w-40 rounded-full bg-accent/40" />
      </div>
    </div>
  );
};

export const TicketCardSkeleton = () => {
  return (
    <Card className="bg-card border-border/50 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32 bg-muted-foreground/20" />
          <Skeleton className="h-8 w-48 bg-muted-foreground/25" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full bg-accent/30" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-24 bg-muted-foreground/20" />
        <Skeleton className="h-10 w-32 rounded-lg bg-muted-foreground/20" />
      </div>
    </Card>
  );
};

export const HotelCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card border-border/50">
      <div className="relative aspect-[16/10] bg-muted animate-pulse">
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-16 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 bg-accent/40" />
          <Skeleton className="h-5 w-5 bg-accent/40" />
          <Skeleton className="h-5 w-5 bg-accent/40" />
          <Skeleton className="h-5 w-5 bg-accent/40" />
        </div>
        <Skeleton className="h-6 w-4/5 bg-muted-foreground/20" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full bg-muted-foreground/15" />
          <Skeleton className="h-5 w-20 rounded-full bg-muted-foreground/15" />
          <Skeleton className="h-5 w-14 rounded-full bg-muted-foreground/15" />
        </div>
        <Skeleton className="h-4 w-full bg-muted-foreground/10" />
        <Skeleton className="h-4 w-3/4 bg-muted-foreground/10" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-24 bg-accent/30" />
          <Skeleton className="h-10 w-28 rounded-lg bg-accent/40" />
        </div>
      </CardContent>
    </Card>
  );
};

// Grid skeleton for listing pages
export const EventGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const ArtistGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ArtistCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const DestinationGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <DestinationCardSkeleton key={i} />
      ))}
    </div>
  );
};
