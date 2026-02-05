import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import Producto from "@/pages/Producto";
import ArtistaDetalle from "@/pages/ArtistaDetalle";

/**
 * Resolutor de rutas para /conciertos/:slug
 * - Si el slug existe como evento (MV conciertos), renderiza Producto
 * - Si no, asume que es un artista y renderiza ArtistaDetalle
 *
 * Evita el conflicto de rutas donde /conciertos/:artistSlug capturaba
 * primero y provocaba 404 en eventos válidos.
 */
export default function ConciertosSlugRouter() {
  const { slug } = useParams<{ slug: string }>();

  const { data: existsAsEvent, isLoading, isError } = useQuery({
    queryKey: ["route-resolver", "conciertos", slug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return false;

      const { data, error } = await (supabase
        .from("lovable_mv_event_product_page_conciertos" as any)
        .select("event_slug") as any)
        .eq("event_slug", slug.toLowerCase())
        .limit(1);

      if (error) {
        // No bloquear navegación por fallos puntuales; cae a ArtistaDetalle.
        console.warn("[RouteResolver] Failed checking event slug:", error);
        return false;
      }

      return Array.isArray(data) && data.length > 0;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  // Mientras resolvemos, no forzamos 404 para evitar "soft 404" por timing.
  if (isLoading) return null;

  if (isError) {
    // Fallback seguro
    return <ArtistaDetalle />;
  }

  if (existsAsEvent) return <Producto />;

  // Si no existe como evento, tratamos el slug como artista.
  // ArtistaDetalle ya maneja su propio "no encontrado".
  return <ArtistaDetalle />;
}
