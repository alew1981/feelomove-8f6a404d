import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProductoSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Hero Skeleton */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          <Skeleton className="h-[380px] sm:h-[420px] md:h-[500px] w-full" />
          
          {/* Overlaid badges skeleton */}
          <div className="absolute top-4 left-4">
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          
          {/* Bottom content skeleton */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-end justify-between gap-4">
              {/* Date card skeleton */}
              <Skeleton className="h-24 w-20 rounded-xl" />
              
              {/* Event info skeleton */}
              <div className="flex-1 text-right space-y-2">
                <Skeleton className="h-8 w-3/4 ml-auto" />
                <Skeleton className="h-5 w-1/2 ml-auto" />
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
