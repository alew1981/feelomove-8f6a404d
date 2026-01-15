import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache for 1 year (CDN-friendly)
const CACHE_MAX_AGE = 60 * 60 * 24 * 365;
// Stale-while-revalidate: serve stale content for 7 days while fetching fresh
const STALE_WHILE_REVALIDATE = 60 * 60 * 24 * 7;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");
    const width = parseInt(url.searchParams.get("w") || "400");
    const quality = parseInt(url.searchParams.get("q") || "80");

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow Ticketmaster domains for security
    const allowedDomains = ["s1.ticketm.net", "media.ticketmaster.com", "tmimg.net"];
    const parsedUrl = new URL(imageUrl);
    if (!allowedDomains.some((d) => parsedUrl.hostname.includes(d))) {
      return new Response(
        JSON.stringify({ error: "Domain not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if client accepts WebP
    const acceptHeader = req.headers.get("Accept") || "";
    const supportsWebP = acceptHeader.includes("image/webp");
    const supportsAvif = acceptHeader.includes("image/avif");

    // Fetch original image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FeeloMoveImageProxy/1.0)",
      },
    });

    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch image", status: imageResponse.status }),
        { status: imageResponse.statusText === "Not Found" ? 404 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("Content-Type") || "image/jpeg";

    // Generate ETag from image URL for cache validation
    const encoder = new TextEncoder();
    const data = encoder.encode(imageUrl + width + quality);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const etag = `"${hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('')}"`;

    // Check If-None-Match for 304 response
    const ifNoneMatch = req.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          "ETag": etag,
          "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}, immutable`,
        },
      });
    }

    // CDN-optimized cache headers
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      // Browser cache + CDN cache with stale-while-revalidate for seamless updates
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}, immutable`,
      // Supabase/Cloudflare CDN cache directive
      "CDN-Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
      // Surrogate-Control for Fastly/Varnish CDNs
      "Surrogate-Control": `max-age=${CACHE_MAX_AGE}`,
      // ETag for cache validation
      "ETag": etag,
      // Vary by Accept header for content negotiation (WebP/AVIF)
      "Vary": "Accept",
      // Debug headers
      "X-Image-Width": width.toString(),
      "X-Image-Quality": quality.toString(),
      "X-Supports-WebP": supportsWebP.toString(),
      "X-Supports-AVIF": supportsAvif.toString(),
      "X-Proxy-Cache": "HIT",
    };

    return new Response(imageBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error("Image proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
