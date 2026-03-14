import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ArtistContentData {
  artist_name: string;
  artist_slug: string | null;
  birthday: string | null;
  origin_city: string | null;
  origin_country: string | null;
  genre_tags: string[] | null;
  fun_fact_es: string | null;
  fun_fact_en: string | null;
  discography: Array<{
    album: string;
    year: number;
    description_es?: string;
    highlights_es?: string;
    description_en?: string;
    highlights_en?: string;
  }> | null;
  signature_songs_es: string | null;
  signature_songs_en: string | null;
  bio_short_es: string | null;
  bio_short_en: string | null;
  why_live_es: string | null;
  why_live_en: string | null;
  spain_history_es: string | null;
  spain_history_en: string | null;
  intro_text_es: string | null;
  intro_text_en: string | null;
  faq_es: Array<{ q: string; a: string }> | null;
  faq_en: Array<{ q: string; a: string }> | null;
  seo_title_es: string | null;
  seo_title_en: string | null;
  meta_description_es: string | null;
  meta_description_en: string | null;
}

/**
 * Fetches rich editorial content for an artist from tm_tbl_artist_content.
 * Returns null gracefully if no content exists for the artist.
 */
export function useArtistContent(artistName: string | undefined) {
  return useQuery<ArtistContentData | null>({
    queryKey: ['artist-content', artistName],
    queryFn: async () => {
      if (!artistName) return null;
      try {
        // Try by artist_name first (primary key)
        const { data, error } = await supabase
          .from('tm_tbl_artist_content')
          .select('*')
          .eq('artist_name', artistName)
          .maybeSingle();

        if (error) {
          console.warn('Artist content query failed:', error.message);
          return null;
        }
        if (data) return data as unknown as ArtistContentData;

        // Fallback: try by artist_slug
        const slug = artistName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const { data: slugData, error: slugError } = await supabase
          .from('tm_tbl_artist_content')
          .select('*')
          .eq('artist_slug', slug)
          .maybeSingle();

        if (slugError) {
          console.warn('Artist content slug query failed:', slugError.message);
          return null;
        }
        return (slugData as unknown as ArtistContentData) ?? null;
      } catch (err) {
        console.error('Artist content fetch error:', err);
        return null;
      }
    },
    enabled: !!artistName,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
}
