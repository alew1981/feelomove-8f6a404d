import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * CRITICAL SEO HOOK: URL Normalization & 301 Redirect Logic
 * 
 * This hook runs on every product page load and handles:
 * 1. Numeric suffix cleanup (-1, -2, -99 but NOT -2026)
 * 2. Plural to singular prefix (/conciertos/ → /concierto/)
 * 3. Noise word removal (paquetes-vip, tickets, world-tour, etc.)
 * 4. Canonical slug verification against database
 * 
 * All redirects are 301 (replace: true) to transfer SEO authority
 */

// Numeric suffix pattern: -1, -2, -99 but NOT years like -2026
const NUMERIC_SUFFIX_REGEX = /-(\d{1,2})$/;

// Year pattern to exclude from numeric suffix removal
const YEAR_PATTERN = /-20[2-9]\d$/;

// Old date suffix pattern: -2024-12-25, -2025-01-15 (outdated dates to clean)
const OLD_DATE_SUFFIX_REGEX = /-20(2[0-4]|25)-\d{2}-\d{2}$/; // 2020-2025 dates

// Noise words that trigger redirect (from slugUtils)
const NOISE_WORDS = [
  'paquetes-vip', 'paquete-vip', 'vip-paquetes', 'vip-paquete',
  'world-tour', 'tour-mundial', 'gira-mundial', 'gira',
  'tickets', 'ticket', 'entradas', 'entrada',
  'ticketless', 'upgrade', 'voucher',
  'parking', 'shuttle', 'transfer', 'bus', 'autobus', 'transporte',
  'feed', 'rss', 'premium', 'gold', 'platinum', 'silver'
];

interface NormalizationResult {
  needsRedirect: boolean;
  redirectPath: string | null;
  isChecking: boolean;
}

/**
 * Removes numeric suffix from slug if present (but not years)
 */
const stripNumericSuffix = (slug: string): { cleaned: string; hadSuffix: boolean } => {
  if (YEAR_PATTERN.test(slug)) {
    return { cleaned: slug, hadSuffix: false };
  }
  
  const match = slug.match(NUMERIC_SUFFIX_REGEX);
  if (match) {
    return { 
      cleaned: slug.replace(NUMERIC_SUFFIX_REGEX, ''), 
      hadSuffix: true 
    };
  }
  
  return { cleaned: slug, hadSuffix: false };
};

/**
 * Removes old date suffixes (e.g., -2025-01-15 for past events)
 * This redirects outdated URLs to the current version
 */
const stripOldDateSuffix = (slug: string): { cleaned: string; hadOldDate: boolean } => {
  const match = slug.match(OLD_DATE_SUFFIX_REGEX);
  if (match) {
    // Extract artist-city part (first segments before the date)
    const cleaned = slug.replace(OLD_DATE_SUFFIX_REGEX, '');
    return { cleaned, hadOldDate: true };
  }
  return { cleaned: slug, hadOldDate: false };
};

/**
 * Removes noise words from slug
 */
const stripNoiseWords = (slug: string): { cleaned: string; hadNoise: boolean } => {
  let cleaned = slug.toLowerCase();
  let hadNoise = false;
  
  for (const noise of NOISE_WORDS.sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`-?${noise.replace(/-/g, '-?')}-?`, 'gi');
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '-');
      hadNoise = true;
    }
  }
  
  // Clean double hyphens and edge hyphens
  cleaned = cleaned.replace(/--+/g, '-').replace(/^-|-$/g, '');
  
  return { cleaned, hadNoise };
};

/**
 * Main hook for URL normalization
 * Returns redirect info and handles automatic 301 redirects
 */
export function useSlugNormalization(
  slug: string | undefined,
  isFestival: boolean
): NormalizationResult {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);
  const isCheckingRef = useRef(false);
  
  useEffect(() => {
    if (!slug || hasRedirectedRef.current || isCheckingRef.current) return;
    
    const normalizeAndRedirect = async () => {
      isCheckingRef.current = true;
      
      try {
        // Step 1: Quick client-side checks
        const prefix = isFestival ? '/festival' : '/concierto';
        let cleanedSlug = slug.toLowerCase();
        let needsRedirect = false;
        
        // Check for plural prefix (/conciertos/ → /concierto/)
        if (location.pathname.startsWith('/conciertos/') && !isFestival) {
          needsRedirect = true;
        }
        
        // Strip numeric suffix
        const { cleaned: noSuffix, hadSuffix } = stripNumericSuffix(cleanedSlug);
        if (hadSuffix) {
          cleanedSlug = noSuffix;
          needsRedirect = true;
        }
        
        // Strip old date suffixes (e.g., -2025-01-15 for outdated URLs)
        const { cleaned: noOldDate, hadOldDate } = stripOldDateSuffix(cleanedSlug);
        if (hadOldDate) {
          cleanedSlug = noOldDate;
          needsRedirect = true;
        }
        
        // Strip noise words
        const { cleaned: noNoise, hadNoise } = stripNoiseWords(cleanedSlug);
        if (hadNoise) {
          cleanedSlug = noNoise;
          needsRedirect = true;
        }
        
        // If slug changed, verify the clean slug exists
        if (needsRedirect && cleanedSlug !== slug) {
          // Check if clean slug exists in database
          const viewName = isFestival 
            ? "lovable_mv_event_product_page_festivales" 
            : "lovable_mv_event_product_page_conciertos";
          
          const { data } = await (supabase
            .from(viewName as any)
            .select("event_slug") as any)
            .eq("event_slug", cleanedSlug)
            .maybeSingle();
          
          if (data?.event_slug) {
            // Clean slug exists - redirect to it
            console.log(`[SEO] Redirecting: ${slug} → ${cleanedSlug}`);
            hasRedirectedRef.current = true;
            navigate(`${prefix}/${cleanedSlug}`, { replace: true });
            return;
          }
          
          // Clean slug doesn't exist - check slug_redirects
          const { data: redirectData } = await supabase
            .from("slug_redirects")
            .select("event_id")
            .eq("old_slug", slug)
            .maybeSingle();
          
          if (redirectData?.event_id) {
            // Get current slug from event table
            const { data: eventData } = await supabase
              .from("tm_tbl_events")
              .select("slug, event_type")
              .eq("id", redirectData.event_id)
              .maybeSingle();
            
            if (eventData?.slug && eventData.slug !== slug) {
              const correctPrefix = eventData.event_type === 'festival' ? '/festival' : '/concierto';
              console.log(`[SEO] Redirect from DB: ${slug} → ${eventData.slug}`);
              hasRedirectedRef.current = true;
              navigate(`${correctPrefix}/${eventData.slug}`, { replace: true });
              return;
            }
          }
        }
      } catch (error) {
        console.warn('[SEO] Normalization check failed:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };
    
    normalizeAndRedirect();
  }, [slug, isFestival, navigate, location.pathname]);
  
  return {
    needsRedirect: hasRedirectedRef.current,
    redirectPath: null,
    isChecking: isCheckingRef.current
  };
}

/**
 * Utility: Generate clean canonical URL from any slug
 * This strips all noise and ensures clean format
 */
export function getCleanCanonicalSlug(slug: string): string {
  let cleaned = slug.toLowerCase();
  
  // Strip noise
  const { cleaned: noNoise } = stripNoiseWords(cleaned);
  cleaned = noNoise;
  
  // Strip numeric suffix (but not years)
  const { cleaned: noSuffix } = stripNumericSuffix(cleaned);
  cleaned = noSuffix;
  
  return cleaned;
}

/**
 * Check if slug contains VIP/Upgrade markers for SEO differentiation
 */
export function isVipSlug(slug: string): boolean {
  const lower = slug.toLowerCase();
  return (
    lower.includes('vip') ||
    lower.includes('upgrade') ||
    lower.includes('premium') ||
    lower.includes('gold') ||
    lower.includes('platinum')
  );
}

/**
 * Check if slug is a service/transport event
 */
export function isServiceSlug(slug: string): boolean {
  const lower = slug.toLowerCase();
  return (
    lower.includes('parking') ||
    lower.includes('bus') ||
    lower.includes('shuttle') ||
    lower.includes('transfer') ||
    lower.includes('transporte') ||
    lower.includes('autobus')
  );
}
