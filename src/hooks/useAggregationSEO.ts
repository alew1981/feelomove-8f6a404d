import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type SEOContentType = 'artist' | 'city' | 'genre';

interface SEOContent {
  seoTitle: string;
  seoDescription: string;
  metaKeywords: string[];
  h1Content: string;
  introText: string;
  ogTags: Record<string, string>;
}

interface RawSEOData {
  seo_title: string | null;
  seo_description: string | null;
  meta_keywords: string[] | null;
  h1_content: string | null;
  intro_text: string | null;
  og_tags: Record<string, string> | null;
}

export const useAggregationSEO = (
  slug: string | undefined,
  type: SEOContentType
) => {
  const [seoContent, setSeoContent] = useState<SEOContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    const fetchSEOContent = async () => {
      try {
        let data: RawSEOData | null = null;

        // Use separate queries for each type to avoid TypeScript issues
        if (type === 'artist') {
          const result = await supabase
            .from('mv_artists_seo_content')
            .select('seo_title, seo_description, meta_keywords, h1_content, intro_text, og_tags')
            .eq('artist_slug', slug)
            .maybeSingle();
          if (result.error) throw result.error;
          data = result.data as RawSEOData | null;
        } else if (type === 'city') {
          const result = await supabase
            .from('mv_cities_seo_content')
            .select('seo_title, seo_description, meta_keywords, h1_content, intro_text, og_tags')
            .eq('city_slug', slug)
            .maybeSingle();
          if (result.error) throw result.error;
          data = result.data as RawSEOData | null;
        } else if (type === 'genre') {
          const result = await supabase
            .from('mv_genres_seo_content')
            .select('seo_title, seo_description, meta_keywords, h1_content, intro_text, og_tags')
            .eq('genre_slug', slug)
            .maybeSingle();
          if (result.error) throw result.error;
          data = result.data as RawSEOData | null;
        }

        if (data) {
          // Update document title
          if (data.seo_title) {
            document.title = data.seo_title;
          }

          // Update meta tags
          const setMetaTag = (name: string, content: string) => {
            if (!content) return;
            let tag = document.querySelector(`meta[name="${name}"]`);
            if (!tag) {
              tag = document.createElement('meta');
              tag.setAttribute('name', name);
              document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
          };

          if (data.seo_description) {
            setMetaTag('description', data.seo_description);
          }
          if (data.meta_keywords && data.meta_keywords.length > 0) {
            setMetaTag('keywords', data.meta_keywords.join(', '));
          }

          // Update Open Graph tags
          if (data.og_tags && typeof data.og_tags === 'object') {
            Object.entries(data.og_tags).forEach(([property, content]) => {
              if (!content) return;
              let tag = document.querySelector(`meta[property="${property}"]`);
              if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                document.head.appendChild(tag);
              }
              tag.setAttribute('content', content);
            });
          }

          setSeoContent({
            seoTitle: data.seo_title || '',
            seoDescription: data.seo_description || '',
            metaKeywords: data.meta_keywords || [],
            h1Content: data.h1_content || '',
            introText: data.intro_text || '',
            ogTags: data.og_tags || {}
          });
        }
      } catch (error) {
        console.error('Error fetching SEO content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSEOContent();
  }, [slug, type]);

  return { seoContent, isLoading };
};
