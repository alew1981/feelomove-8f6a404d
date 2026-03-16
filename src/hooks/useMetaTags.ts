import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MetaTagsData {
  slug: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_url: string | null;
  og_type: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  canonical_url: string | null;
  noindex: boolean | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
}

/**
 * Hook to fetch meta tags from mv_events_meta_tags.
 * Returns the data so callers can use it to override SEOHead props.
 */
export const useMetaTags = (eventSlug: string | undefined) => {
  return useQuery<MetaTagsData | null>({
    queryKey: ['meta-tags', eventSlug],
    enabled: !!eventSlug,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('mv_events_meta_tags')
          .select('slug, og_title, og_description, og_image, og_url, og_type, meta_description, meta_keywords, canonical_url, noindex, twitter_card, twitter_title, twitter_description, twitter_image')
          .eq('slug', eventSlug!.toLowerCase())
          .maybeSingle();

        if (error) {
          console.warn('Meta tags fetch warning (MV may be refreshing):', error.message);
          return null;
        }

        return data as MetaTagsData | null;
      } catch (err) {
        console.warn('Meta tags fetch failed:', err);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};
