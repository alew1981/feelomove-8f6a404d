import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import Producto from "@/pages/Producto";
import ArtistaDetalle from "@/pages/ArtistaDetalle";
import { useEffect, useRef } from "react";

/**
 * Resolutor de rutas para /conciertos/:slug y /en/tickets/:slug
 * 1. Si el slug existe como evento (MV conciertos), renderiza Producto
 * 2. Si existe en slug_redirects, ejecuta redirect 301 al nuevo slug
 * 3. Si no, asume que es un artista y renderiza ArtistaDetalle
 */
export default function ConciertosSlugRouter() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);

  const isEnglish = location.pathname.startsWith("/en/");

  const { data: resolution, isLoading, isError } = useQuery({
    queryKey: ["route-resolver", "conciertos", slug],
    enabled: !!slug,
    queryFn: async (): Promise<{ type: "event" | "redirect" | "artist"; redirectSlug?: string; isFestival?: boolean }> => {
      if (!slug) return { type: "artist" };

      // Step 1: Check slug_redirects FIRST — if old_slug matches, redirect immediately
      const { data: redirectData } = await supabase
        .from("slug_redirects")
        .select("event_id")
        .eq("old_slug", slug.toLowerCase())
        .maybeSingle();

      if (redirectData?.event_id) {
        const { data: eventData } = await supabase
          .from("tm_tbl_events")
          .select("slug, event_type")
          .eq("id", redirectData.event_id)
          .maybeSingle();

        if (eventData?.slug) {
          return {
            type: "redirect",
            redirectSlug: eventData.slug,
            isFestival: eventData.event_type === "festival",
          };
        }
      }

      // Step 2: No redirect — check if slug exists as a concert event
      const { data, error } = await (supabase
        .from("lovable_mv_event_product_page_conciertos" as any)
        .select("event_slug") as any)
        .eq("event_slug", slug.toLowerCase())
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        return { type: "event" };
      }

      // Step 3: Not a redirect, not an event → treat as artist
      return { type: "artist" };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  // Handle redirect via window.location.replace (301-like for SEO)
  useEffect(() => {
    if (hasRedirectedRef.current) return;
    if (resolution?.type !== "redirect" || !resolution.redirectSlug) return;

    hasRedirectedRef.current = true;

    const isFestival = resolution.isFestival;
    const esPath = isFestival
      ? `/festivales/${resolution.redirectSlug}`
      : `/conciertos/${resolution.redirectSlug}`;

    // Locale-aware redirect
    let targetPath = esPath;
    if (isEnglish) {
      targetPath = esPath
        .replace(/^\/festivales\//, "/en/festivals/")
        .replace(/^\/conciertos\//, "/en/tickets/");
    }

    console.log(`[RouteResolver] slug_redirects 301: ${slug} → ${targetPath}`);
    window.location.replace(targetPath);
  }, [resolution, slug, isEnglish]);

  // Mientras resolvemos, no forzamos 404 para evitar "soft 404" por timing.
  if (isLoading) return null;

  // If redirecting, show nothing while browser navigates
  if (resolution?.type === "redirect") return null;

  if (isError) {
    return <ArtistaDetalle />;
  }

  if (resolution?.type === "event") return <Producto slugProp={slug} />;

  // Si no existe como evento, tratamos el slug como artista.
  return <ArtistaDetalle slugProp={slug} />;
}
