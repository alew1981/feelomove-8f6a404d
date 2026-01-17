import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const PageLoader = () => (
  <div className="min-h-screen bg-background">
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="hidden md:flex gap-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
    <div className="pt-16">
      <Skeleton className="h-64 w-full" />
    </div>
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full max-w-2xl mb-8" />
    </div>
  </div>
);

const RedirectProducto = () => {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // Clean slug - remove trailing /feed or /feed/ from WordPress legacy URLs
  const slug = rawSlug?.replace(/\/feed\/?$/, '') || '';

  const { data: eventData, isLoading, error } = useQuery({
    queryKey: ['event-type', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      // First try to find the event directly
      const { data: directEvent, error: directError } = await supabase
        .from("tm_tbl_events")
        .select("event_type, slug")
        .eq("slug", slug)
        .maybeSingle();
      
      if (directEvent) return directEvent;
      
      // If not found, check if it's an old slug that needs redirect
      const { data: redirect, error: redirectError } = await supabase
        .from("slug_redirects")
        .select("new_slug")
        .eq("old_slug", slug)
        .maybeSingle();
      
      if (redirect) {
        // Get the event with the new slug
        const { data: redirectedEvent } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug")
          .eq("slug", redirect.new_slug)
          .maybeSingle();
        
        return redirectedEvent;
      }
      
      if (directError) throw directError;
      return null;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (eventData) {
      const isFestival = eventData.event_type === 'festival';
      const newPath = isFestival 
        ? `/festival/${eventData.slug}` 
        : `/concierto/${eventData.slug}`;
      navigate(newPath, { replace: true });
    } else if (!isLoading && !eventData) {
      // If no event found, redirect to 404
      navigate('/404', { replace: true });
    }
  }, [eventData, isLoading, navigate]);

  if (error) {
    navigate('/404', { replace: true });
    return null;
  }

  return <PageLoader />;
};

export default RedirectProducto;
