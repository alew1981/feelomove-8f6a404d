import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache for 30 days
const CACHE_MAX_AGE = 60 * 60 * 24 * 30;

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

    // For now, we'll pass through the original image with proper cache headers
    // In a production setup, you'd use Sharp or a similar library for conversion
    // Deno Deploy doesn't support native image processing, so we optimize via cache headers
    
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, immutable`,
      "CDN-Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
      "Vary": "Accept",
      "X-Image-Width": width.toString(),
      "X-Image-Quality": quality.toString(),
      "X-Supports-WebP": supportsWebP.toString(),
      "X-Supports-AVIF": supportsAvif.toString(),
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
