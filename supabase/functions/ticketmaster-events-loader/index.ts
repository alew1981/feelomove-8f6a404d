// supabase/functions/ticketmaster-events-loader/index.ts
// VERSIÓN OPTIMIZADA - PARALELISMO DE 5 REQ/SEC Y UPSERT AGRUPADO 🚀

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TICKETMASTER_API_KEY = Deno.env.get("TICKETMASTER_API_KEY") || "qkd871ahfBGquOmMOZJPzwo5Wu0e9mMP";
const IMPACT_AFFILIATE_BASE = "https://ticketmaster.evyy.net/c/6789338/557537/4272?u=";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BATCH_SIZE = 100;
const MAX_PAGES = 100;
const CONCURRENCY = 5; // Máximo de peticiones simultáneas por segundo (Rate Limit TM)

console.log("=== TICKETMASTER LOADER: VERSIÓN PARALELIZADA 🚀 ===");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateAffiliateUrl(ticketmasterUrl: string): string | null {
  if (!ticketmasterUrl) return null;
  return `${IMPACT_AFFILIATE_BASE}${encodeURIComponent(ticketmasterUrl)}`;
}

interface TransformResult {
  eventData: Record<string, unknown>;
  festivalData: Record<string, unknown> | null;
  isFestival: boolean;
}

function transformEvent(event: Record<string, unknown>): TransformResult {
  const eventId = event.id as string;
  const eventDateValue = (event.event_date as Record<string, unknown>)?.value as string;
  const eventDate = eventDateValue || "9999-12-31T00:00:00Z";
  const categories = event.categories as Array<Record<string, unknown>> | undefined;
  const isFestival = categories?.[0]?.id === 10101;
  const affiliateUrl = event.url ? generateAffiliateUrl(event.url as string) : null;

  const categoriesData = categories?.map((cat) => ({
    id: cat.id,
    name: cat.name,
    subcategories: (cat.subcategories as Array<Record<string, unknown>>)?.map((sub) => ({ id: sub.id, name: sub.name })) || []
  })) || null;

  const venue = event.venue as Record<string, unknown> | undefined;
  const venueLocation = venue?.location as Record<string, unknown> | undefined;
  const venueAddress = venueLocation?.address as Record<string, unknown> | undefined;
  const attractions = event.attractions as Array<Record<string, unknown>> | undefined;
  const images = event.images as Record<string, Record<string, unknown>> | undefined;
  const properties = event.properties as Record<string, unknown> | undefined;
  const priceRanges = event.price_ranges as Record<string, Record<string, string>> | undefined;
  const seatmap = event.seatmap as Record<string, unknown> | undefined;
  const localEventDate = event.local_event_date as Record<string, unknown> | undefined;
  const onSaleDate = event.on_sale_date as Record<string, unknown> | undefined;
  const offSaleDate = event.off_sale_date as Record<string, unknown> | undefined;
  const doorOpeningDate = event.door_opening_date as Record<string, unknown> | undefined;
  const eventDateObj = event.event_date as Record<string, unknown> | undefined;

  const eventData = {
    id: eventId,
    domain: event.domain || "spain",
    name: ((event.name as string) || "Sin nombre").trim(),
    url: affiliateUrl,
    external_url: event.external_url || false,
    event_type: isFestival ? "festival" : "concert",
    event_date: eventDate,
    local_event_date: localEventDate?.value || null,
    day_of_week: event.day_of_week || null,
    timezone: event.timezone || "Europe/Madrid",
    on_sale_date: onSaleDate?.value || null,
    off_sale_date: offSaleDate?.value || null,
    door_opening_date: doorOpeningDate?.value || null,
    image_large_url: images?.large?.url || null,
    image_large_height: images?.large?.height || null,
    image_large_width: images?.large?.width || null,
    image_standard_url: images?.standard?.url || null,
    image_standard_height: images?.standard?.height || null,
    image_standard_width: images?.standard?.width || null,
    schedule_status: properties?.schedule_status || "regular",
    cancelled: properties?.cancelled || false,
    rescheduled: properties?.rescheduled || false,
    seats_available: properties?.seats_available || false,
    sold_out: properties?.sold_out || false,
    is_package: properties?.package || false,
    minimum_age_required: properties?.minimum_age_required || null,
    venue_id: venue?.id || null,
    venue_name: venue?.name || null,
    venue_url: venue?.url || null,
    venue_address: venueAddress?.address || null,
    venue_postal_code: venueAddress?.postal_code || null,
    venue_city: (venueAddress?.city as string) || "Desconocida",
    venue_country: (venueAddress?.country as string) || "España",
    venue_longitude: venueAddress?.long ? parseFloat(venueAddress.long as string) : null,
    venue_latitude: venueAddress?.lat ? parseFloat(venueAddress.lat as string) : null,
    primary_category_id: categories?.[0]?.id || null,
    primary_category_name: categories?.[0]?.name || null,
    primary_subcategory_id: (categories?.[0]?.subcategories as Array<Record<string, unknown>>)?.[0]?.id || null,
    primary_subcategory_name: (categories?.[0]?.subcategories as Array<Record<string, unknown>>)?.[0]?.name || null,
    primary_attraction_id: attractions?.[0]?.id || null,
    primary_attraction_name: ((attractions?.[0]?.name as string) || "").trim() || null,
    secondary_attraction_id: attractions?.[1]?.id || null,
    secondary_attraction_name: attractions?.[1]?.name || null,
    attraction_ids: attractions?.map((a) => a.id) || null,
    attraction_names: attractions?.map((a) => a.name) || null,
    currency: event.currency || "EUR",
    price_min_excl_fees: priceRanges?.excluding_ticket_fees?.min ? parseFloat(priceRanges.excluding_ticket_fees.min) : null,
    price_max_excl_fees: priceRanges?.excluding_ticket_fees?.max ? parseFloat(priceRanges.excluding_ticket_fees.max) : null,
    price_min_incl_fees: priceRanges?.including_ticket_fees?.min ? parseFloat(priceRanges.including_ticket_fees.min) : null,
    price_max_incl_fees: priceRanges?.including_ticket_fees?.max ? parseFloat(priceRanges.including_ticket_fees.max) : null,
    seatmap_static: !!seatmap?.staticUrl,
    needs_price_update: true,
    has_real_availability: properties?.seats_available || false,
    event_date_format: eventDateObj?.format || "datetime",
    local_event_date_format: localEventDate?.format || "datetime",
    attraction_urls: attractions?.map((a) => a.url).filter(Boolean) || null,
    secondary_attraction_url: attractions?.[1]?.url || null,
    categories_data: categoriesData,
    updated_at: new Date().toISOString(),
  };

  const festivalData = isFestival ? {
    festival_event_id: eventId,
    start_date: eventDate.substring(0, 10),
    end_date: eventDate.substring(0, 10),
    lineup_artists: attractions?.map((a) => a.name) || [],
    lineup_artist_ids: attractions?.map((a) => a.id) || [],
    headliners: attractions?.slice(0, 3).map((a) => a.name) || [],
    updated_at: new Date().toISOString(),
  } : null;

  return { eventData, festivalData, isFestival };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const testUrl = `https://app.ticketmaster.eu/mfxapi/v2/events?apikey=${TICKETMASTER_API_KEY}&domain=spain&rows=1&category_ids=10001,10101`;
    const testRes = await fetch(testUrl);
    const testData = await testRes.json();
    const totalAvailable = testData.pagination?.total || 0;

    console.log(`📊 Total TM: ${totalAvailable} eventos. Procesando con concurrencia de ${CONCURRENCY}...`);

    let totalProcessed = 0;
    let festivalsProcessed = 0;

    for (let page = 0; page < MAX_PAGES; page += CONCURRENCY) {
      const currentBatchStart = page * BATCH_SIZE;
      if (currentBatchStart >= totalAvailable) break;

      console.log(`\n🚀 Bloque: Páginas ${page + 1} a ${Math.min(page + CONCURRENCY, MAX_PAGES)}`);

      // 1. LANZAR PETICIONES SIMULTÁNEAS (Máx 5 por segundo)
      const fetchPromises = [];
      for (let i = 0; i < CONCURRENCY; i++) {
        const targetPage = page + i;
        const start = targetPage * BATCH_SIZE;
        if (start >= totalAvailable || targetPage >= MAX_PAGES) continue;

        const url = new URL("https://app.ticketmaster.eu/mfxapi/v2/events");
        url.searchParams.append("apikey", TICKETMASTER_API_KEY);
        url.searchParams.append("domain", "spain");
        url.searchParams.append("rows", BATCH_SIZE.toString());
        url.searchParams.append("start", start.toString());
        url.searchParams.append("category_ids", "10001,10101");
        url.searchParams.append("sort_by", "onsaledate");
        url.searchParams.append("order", "desc");

        fetchPromises.push(fetch(url.toString()).then(r => r.json()));
      }

      const rawResponses = await Promise.all(fetchPromises);

      // 2. PROCESAR Y AGRUPAR RESULTADOS
      const allEventsBatch: Record<string, unknown>[] = [];
      const allFestivalsBatch: Record<string, unknown>[] = [];

      for (const responseData of rawResponses) {
        if (responseData.events) {
          const transformed = responseData.events.map(transformEvent);
          allEventsBatch.push(...transformed.map((t: TransformResult) => t.eventData));
          allFestivalsBatch.push(...transformed.filter((t: TransformResult) => t.isFestival).map((t: TransformResult) => t.festivalData));
        }
      }

      // 3. UPSERT ÚNICO PARA TODO EL BLOQUE (Ahorra tiempo de triggers y red)
      if (allEventsBatch.length > 0) {
        const { error: eventError } = await supabase
          .from("tm_tbl_events")
          .upsert(allEventsBatch, { onConflict: "id" });

        if (eventError) console.error(`❌ Error en tabla events:`, eventError.message);

        if (allFestivalsBatch.length > 0) {
          const { error: festError } = await supabase
            .from("tm_tbl_festival_details")
            .upsert(allFestivalsBatch, { onConflict: "festival_event_id" });
          if (!festError) festivalsProcessed += allFestivalsBatch.length;
        }

        totalProcessed += allEventsBatch.length;
        console.log(`✅ Bloque guardado: ${allEventsBatch.length} eventos.`);
      }

      // 4. ESPERA DE SEGURIDAD PARA RESETEAR RATE LIMIT
      await delay(1000);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    return new Response(JSON.stringify({
      success: true,
      processed: totalProcessed,
      festivals: festivalsProcessed,
      duration_seconds: duration
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("❌ Error fatal:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
