import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ArtistSchemaRow {
  artist_name: string | null;
  artist_slug: string | null;
  music_group_schema: Record<string, unknown> | null;
  faq_schema_es: Record<string, unknown> | null;
  faq_schema_en: Record<string, unknown> | null;
  next_event_date: string | null;
  total_upcoming_events: number | null;
}

export function useArtistSchema(artistName: string | null | undefined) {
  return useQuery<ArtistSchemaRow | null>({
    queryKey: ["artist-schema-org", artistName],
    queryFn: async () => {
      if (!artistName) return null;

      const { data, error } = await supabase
        .from("mv_artists_schema_org")
        .select("*")
        .eq("artist_name", artistName)
        .maybeSingle();

      if (error) {
        console.error("[useArtistSchema] Error:", error);
        return null;
      }

      return (data as ArtistSchemaRow) ?? null;
    },
    enabled: !!artistName,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
