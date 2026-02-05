import { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles legacy URL redirects
 * Checks if the provided ID/name is an old event_id or event_name and redirects to the new slug-based URL
 */
export const handleLegacyRedirect = async (
  idOrName: string,
  navigate: NavigateFunction
): Promise<boolean> => {
  try {
    // Check if it's a numeric ID (old event_id format)
    const isNumericId = /^\d+$/.test(idOrName);
    
    let query = (supabase
      .from("lovable_mv_event_product_page" as any)
      .select("event_slug, event_type") as any)
      .limit(1);
    
    if (isNumericId) {
      query = query.eq("event_id", idOrName);
    } else {
      // Try matching by event name
      query = query.eq("event_name", decodeURIComponent(idOrName));
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (!error && data?.event_slug) {
      // Redirect to the new SEO-friendly URL
      const isFestival = data.event_type === 'festival';
      // CRITICAL SEO: Use plural routes as canonical
      const newPath = isFestival 
        ? `/festivales/${data.event_slug}` 
        : `/conciertos/${data.event_slug}`;
      navigate(newPath, { replace: true });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error handling legacy redirect:", error);
    return false;
  }
};
