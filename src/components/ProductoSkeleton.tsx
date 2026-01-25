import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProductoSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Mobile: Event Name Skeleton above hero - matches real layout */}
        <div className="md:hidden mb-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </div>
        
        {/* Hero Skeleton - EXACT dimensions match Producto.tsx hero */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          {/* Height matches: h-[200px] sm:h-[340px] md:h-[420px] */}
          <Skeleton className="h-[200px] sm:h-[340px] md:h-[420px] w-full" />
          
          {/* Mobile: Compact date/city badge skeleton - matches real position */}
          <div className="absolute left-2 bottom-2 sm:hidden">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-2.5 py-2 flex items-center gap-2">
              <div className="text-center border-r border-border pr-2">
                <Skeleton className="h-2 w-6 mx-auto mb-1" />
                <Skeleton className="h-6 w-6 mx-auto" />
              </div>
              <div className="text-left">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          </div>
          
          {/* Desktop: Full Date Card skeleton - matches real dimensions */}
          <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 hidden sm:block">
            <div className="bg-card rounded-xl shadow-lg p-4 sm:p-5 md:p-6 min-w-[140px] sm:min-w-[160px] md:min-w-[180px]">
              <div className="text-center">
                <Skeleton className="h-4 w-10 mx-auto" />
                <Skeleton className="h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 mx-auto my-1 sm:my-2" />
                <Skeleton className="h-5 w-12 mx-auto" />
                <div className="border-t border-border mt-3 pt-3 sm:mt-4 sm:pt-4">
                  <Skeleton className="h-6 sm:h-7 md:h-8 w-16 mx-auto" />
                  <div className="flex flex-col items-center gap-1 mt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumbs Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tickets & Hotels */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tickets Section */}
            <Card className="border-border/50">
              <CardHeader>
                <Skeleton className="h-7 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-border/50 rounded-xl p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <div className="flex items-center justify-between pt-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hotels Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-52" />
                  <Skeleton className="h-9 w-36 rounded-md" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-4 border border-border/30 rounded-xl">
                      <Skeleton className="h-32 w-40 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-6 w-20 ml-auto" />
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
            <Card className="sticky top-24 border-border/50">
              <CardHeader>
                <Skeleton className="h-7 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-px w-full" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-7 w-20" />
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductoSkeleton;
