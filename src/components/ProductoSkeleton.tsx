import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * ProductoSkeleton - CLS-optimized skeleton for concert/festival detail pages
 * 
 * CRITICAL: All dimensions MUST match the real Producto.tsx layout exactly:
 * - Hero: h-[200px] sm:h-[340px] md:h-[420px] with aspect-ratio fallback
 * - Mobile title: text-xl (1.25rem/1.75 line-height = 1.75rem height)
 * - Tickets block: min-height 280px to prevent jumps
 * - Hotels block: min-height 400px to prevent jumps
 */
const ProductoSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Breadcrumbs Skeleton - matches real breadcrumb height */}
        <div className="mb-4">
          <Skeleton className="h-5 w-64 rounded" />
        </div>
        
        {/* Mobile: Event Name Skeleton - EXACT dimensions from Producto.tsx */}
        {/* Real: text-xl font-black = ~28px height with line-height */}
        <div className="md:hidden mb-3">
          <Skeleton className="h-7 w-3/4 rounded-md" />
          <Skeleton className="h-5 w-1/2 mt-1 rounded" />
        </div>
        
        {/* Hero Skeleton - EXACT dimensions: h-[200px] sm:h-[340px] md:h-[420px] */}
        {/* Using fixed heights prevents CLS - aspect-ratio as fallback */}
        <div 
          className="relative rounded-2xl overflow-hidden mb-8"
          style={{ 
            // Reserve exact space to prevent layout shift
            minHeight: '200px',
            aspectRatio: '16/9'
          }}
        >
          {/* Fixed height container matching real hero */}
          <div className="relative h-[200px] sm:h-[340px] md:h-[420px] w-full">
            <Skeleton className="absolute inset-0 w-full h-full animate-shimmer" />
            
            {/* Gradient overlay placeholder */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            
            {/* Mobile: Compact date/city badge skeleton - matches real position */}
            <div className="absolute left-2 bottom-2 sm:hidden">
              <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-2.5 py-2 flex items-center gap-2">
                <div className="text-center border-r border-border pr-2">
                  <Skeleton className="h-2.5 w-6 mx-auto mb-1 rounded" />
                  <Skeleton className="h-6 w-6 mx-auto rounded" />
                </div>
                <div className="text-left">
                  <Skeleton className="h-4 w-10 rounded" />
                  <Skeleton className="h-3 w-16 mt-1 rounded" />
                </div>
              </div>
            </div>
            
            {/* Desktop: Full Date Card skeleton - EXACT dimensions from Producto.tsx */}
            {/* Real: min-w-[140px] sm:min-w-[160px] md:min-w-[180px], p-4/5/6 */}
            <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 hidden sm:block">
              <div className="bg-card rounded-xl shadow-lg p-4 sm:p-5 md:p-6 min-w-[140px] sm:min-w-[160px] md:min-w-[180px]">
                <div className="text-center">
                  {/* Month: text-sm sm:text-base */}
                  <Skeleton className="h-4 sm:h-5 w-10 mx-auto rounded" />
                  {/* Day: text-4xl sm:text-5xl md:text-6xl = 40-60px */}
                  <Skeleton className="h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 mx-auto my-1 sm:my-2 rounded-lg" />
                  {/* Year: text-base sm:text-lg */}
                  <Skeleton className="h-5 sm:h-6 w-12 mx-auto rounded" />
                  <div className="border-t border-border mt-3 pt-3 sm:mt-4 sm:pt-4">
                    {/* Time: text-xl sm:text-2xl md:text-3xl */}
                    <Skeleton className="h-6 sm:h-7 md:h-8 w-16 mx-auto rounded" />
                    <div className="flex flex-col items-center gap-1 mt-2">
                      <Skeleton className="h-4 sm:h-5 w-20 rounded" />
                      <Skeleton className="h-3 sm:h-4 w-24 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop: Center title skeleton */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center max-w-[50%] hidden sm:flex flex-col items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 sm:h-10 md:h-12 w-64 sm:w-80 md:w-96 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tickets & Hotels */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tickets Section - min-height prevents CLS */}
            <Card className="border-border/50" style={{ minHeight: '280px' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-7 w-40 rounded-md" />
                </div>
              </CardHeader>
              <CardContent>
                {/* 2x2 grid on mobile, 3 cols on desktop - matches real layout */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="border border-border/50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3"
                      style={{ minHeight: '140px' }}
                    >
                      {/* Ticket type name */}
                      <Skeleton className="h-5 w-3/4 rounded" />
                      {/* Description */}
                      <Skeleton className="h-4 w-full rounded" />
                      {/* Availability badge */}
                      <Skeleton className="h-5 w-16 rounded-full" />
                      {/* Price + button row */}
                      <div className="flex items-center justify-between pt-1 sm:pt-2">
                        <Skeleton className="h-6 w-16 rounded" />
                        <Skeleton className="h-8 w-20 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hotels Section - min-height prevents CLS */}
            <Card className="border-border/50" style={{ minHeight: '400px' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-7 w-52 rounded-md" />
                  </div>
                  <Skeleton className="h-9 w-28 rounded-md" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-border/30 rounded-xl"
                      style={{ minHeight: '120px' }}
                    >
                      {/* Hotel image - aspect matches real HotelCard */}
                      <Skeleton className="h-24 sm:h-28 w-28 sm:w-36 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        {/* Hotel name */}
                        <Skeleton className="h-5 w-3/4 rounded" />
                        {/* Star rating */}
                        <Skeleton className="h-4 w-20 rounded" />
                        {/* Facilities badges */}
                        <div className="flex gap-2 flex-wrap">
                          <Skeleton className="h-5 w-14 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                        {/* Description line */}
                        <Skeleton className="h-4 w-full rounded" />
                      </div>
                      {/* Price + button column */}
                      <div className="text-right space-y-2 flex-shrink-0 hidden sm:block">
                        <Skeleton className="h-6 w-20 ml-auto rounded" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Cart Skeleton */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-border/50" style={{ minHeight: '300px' }}>
              <CardHeader>
                <Skeleton className="h-7 w-32 rounded-md" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Empty cart state */}
                <div className="text-center py-4">
                  <Skeleton className="h-12 w-12 mx-auto rounded-full mb-3" />
                  <Skeleton className="h-5 w-40 mx-auto rounded" />
                  <Skeleton className="h-4 w-48 mx-auto mt-2 rounded" />
                </div>
                <Skeleton className="h-px w-full" />
                {/* Summary rows */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-20 rounded" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-px w-full" />
                {/* Total */}
                <div className="flex justify-between">
                  <Skeleton className="h-7 w-28 rounded" />
                  <Skeleton className="h-7 w-20 rounded" />
                </div>
                {/* Buttons */}
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Related Links skeleton */}
        <div className="mt-8" style={{ minHeight: '100px' }}>
          <Skeleton className="h-6 w-48 mb-4 rounded" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductoSkeleton;
