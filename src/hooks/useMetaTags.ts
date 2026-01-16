import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch meta tags from mv_events_meta_tags and inject them into the document head.
 * Uses try-catch to gracefully handle errors from materialized views (406/500 errors).
 * @param eventSlug - The event slug to fetch meta tags for
 */
export const useMetaTags = (eventSlug: string | undefined) => {
  useEffect(() => {
    if (!eventSlug) return;

    const fetchAndApplyMetaTags = async () => {
      try {
        const { data, error } = await supabase
          .from('mv_events_meta_tags')
          .select('*')
          .eq('slug', eventSlug)
          .maybeSingle(); // Use maybeSingle to avoid errors when no row found

        if (error) {
          // Log as warning, not error - MVs can be temporarily unavailable
          console.warn('Meta tags fetch warning (MV may be refreshing):', error.message);
          return;
        }

        if (!data) return;

        // Update title
        if (data.og_title) {
          document.title = data.og_title;
        }

        // Helper function to update/create meta tags
        const setMetaTag = (property: string, content: string | null | undefined, isProperty = true) => {
          if (!content) return;
          
          const attribute = isProperty ? 'property' : 'name';
          let tag = document.querySelector(`meta[${attribute}="${property}"]`);
          
          if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attribute, property);
            document.head.appendChild(tag);
          }
          
          tag.setAttribute('content', content);
        };

        // Meta description
        setMetaTag('description', data.meta_description, false);

        // Meta keywords
        if (data.meta_keywords && data.meta_keywords.length > 0) {
          setMetaTag('keywords', data.meta_keywords.join(', '), false);
        }

        // Canonical URL
        if (data.canonical_url) {
          let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
          if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
          }
          linkCanonical.setAttribute('href', data.canonical_url);
        }

        // Open Graph tags
        setMetaTag('og:title', data.og_title);
        setMetaTag('og:description', data.og_description);
        setMetaTag('og:image', data.og_image);
        setMetaTag('og:url', data.og_url);
        setMetaTag('og:type', data.og_type);
        setMetaTag('og:site_name', data.og_site_name);
        setMetaTag('og:locale', data.og_locale);

        // Twitter Card tags
        setMetaTag('twitter:card', data.twitter_card, false);
        setMetaTag('twitter:title', data.twitter_title, false);
        setMetaTag('twitter:description', data.twitter_description, false);
        setMetaTag('twitter:image', data.twitter_image, false);
      } catch (err) {
        console.warn('Meta tags injection failed:', err);
      }
    };

    fetchAndApplyMetaTags();
  }, [eventSlug]);
};
