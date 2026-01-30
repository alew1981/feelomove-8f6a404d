import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 20;

interface PriceData {
  price_min_incl_fees?: number;
  price_max_incl_fees?: number;
  currency?: string;
  sold_out?: boolean;
  cancelled?: boolean;
  rescheduled?: boolean;
}

interface ProcessResult {
  processed: number;
  remaining: number;
  success: number;
  failed: number;
  reset: number;
  details: Array<{
    event_id: string;
    status: "success" | "failed" | "reset";
    message?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[ticketmaster-prices-updater] Starting batch processing...");

    // Step 1: Count total pending events
    const { count: totalPending, error: countError } = await supabase
      .from("tm_tbl_events")
      .select("*", { count: "exact", head: true })
      .eq("needs_price_update", true);

    if (countError) {
      console.error("[ticketmaster-prices-updater] Count error:", countError);
      throw new Error(`Failed to count pending events: ${countError.message}`);
    }

    console.log(`[ticketmaster-prices-updater] Total pending: ${totalPending}`);

    // Step 2: Fetch the oldest BATCH_SIZE events that need update
    // We use updated_at to get the oldest ones first (FIFO queue)
    const { data: eventsToProcess, error: fetchError } = await supabase
      .from("tm_tbl_events")
      .select("id, name, url, needs_price_update, updated_at")
      .eq("needs_price_update", true)
      .order("updated_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error("[ticketmaster-prices-updater] Fetch error:", fetchError);
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    if (!eventsToProcess || eventsToProcess.length === 0) {
      console.log("[ticketmaster-prices-updater] No events to process");
      const result: ProcessResult = {
        processed: 0,
        remaining: 0,
        success: 0,
        failed: 0,
        reset: 0,
        details: [],
      };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ticketmaster-prices-updater] Processing ${eventsToProcess.length} events...`);

    const result: ProcessResult = {
      processed: eventsToProcess.length,
      remaining: Math.max(0, (totalPending || 0) - eventsToProcess.length),
      success: 0,
      failed: 0,
      reset: 0,
      details: [],
    };

    // Step 3: Process each event
    for (const event of eventsToProcess) {
      try {
        console.log(`[ticketmaster-prices-updater] Processing event: ${event.id} - ${event.name}`);

        // Fetch prices from Ticketmaster API if URL exists
        let priceData: PriceData | null = null;
        
        if (event.url) {
          // Try to fetch event details from Ticketmaster
          try {
            const tmApiKey = Deno.env.get("TICKETMASTER_API_KEY");
            if (tmApiKey) {
              const eventId = event.id;
              const apiUrl = `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json?apikey=${tmApiKey}`;
              
              const response = await fetch(apiUrl, {
                headers: { "Accept": "application/json" },
              });
              
              if (response.ok) {
                const data = await response.json();
                
                // Extract price information
                if (data.priceRanges && data.priceRanges.length > 0) {
                  priceData = {
                    price_min_incl_fees: data.priceRanges[0].min,
                    price_max_incl_fees: data.priceRanges[0].max,
                    currency: data.priceRanges[0].currency || "EUR",
                  };
                }
                
                // Extract availability
                if (data.dates?.status?.code) {
                  if (!priceData) priceData = {};
                  priceData.sold_out = data.dates.status.code === "offsale" || 
                                       data.dates.status.code === "cancelled";
                  priceData.cancelled = data.dates.status.code === "cancelled";
                  priceData.rescheduled = data.dates.status.code === "rescheduled";
                }
              } else if (response.status === 404) {
                // Event not found in TM API - might be removed
                console.log(`[ticketmaster-prices-updater] Event ${event.id} not found in TM API`);
              } else {
                console.warn(`[ticketmaster-prices-updater] TM API error for ${event.id}: ${response.status}`);
                throw new Error(`TM API returned ${response.status}`);
              }
            }
          } catch (apiError) {
            console.warn(`[ticketmaster-prices-updater] API fetch failed for ${event.id}:`, apiError);
            // Continue with just marking as processed
          }
        }

        // Update the event - mark as processed
        const updateData: Record<string, unknown> = {
          needs_price_update: false,
          updated_at: new Date().toISOString(),
        };

        // Add price data if we got it
        if (priceData) {
          Object.assign(updateData, priceData);
        }

        const { error: updateError } = await supabase
          .from("tm_tbl_events")
          .update(updateData)
          .eq("id", event.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        result.success++;
        result.details.push({
          event_id: event.id,
          status: "success",
          message: priceData ? "Updated with new prices" : "Marked as processed",
        });

        console.log(`[ticketmaster-prices-updater] ✓ Event ${event.id} processed successfully`);

      } catch (eventError) {
        console.error(`[ticketmaster-prices-updater] ✗ Failed to process ${event.id}:`, eventError);
        
        // Check if this event has been failing repeatedly
        // We'll use a heuristic: if updated_at is more than 24 hours old and still needs_price_update,
        // it's likely stuck and should be reset
        const eventUpdatedAt = new Date(event.updated_at);
        const hoursSinceUpdate = (Date.now() - eventUpdatedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate > 24) {
          // This event has been stuck for over 24 hours - reset it
          console.log(`[ticketmaster-prices-updater] Event ${event.id} stuck for ${hoursSinceUpdate.toFixed(1)}h, resetting...`);
          
          const { error: resetError } = await supabase
            .from("tm_tbl_events")
            .update({
              needs_price_update: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", event.id);

          if (!resetError) {
            result.reset++;
            result.details.push({
              event_id: event.id,
              status: "reset",
              message: `Stuck for ${hoursSinceUpdate.toFixed(1)} hours, reset to prevent blocking`,
            });
          } else {
            result.failed++;
            result.details.push({
              event_id: event.id,
              status: "failed",
              message: String(eventError),
            });
          }
        } else {
          result.failed++;
          result.details.push({
            event_id: event.id,
            status: "failed",
            message: String(eventError),
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[ticketmaster-prices-updater] Batch complete in ${duration}ms`);
    console.log(`[ticketmaster-prices-updater] Results: ${result.success} success, ${result.failed} failed, ${result.reset} reset, ${result.remaining} remaining`);

    return new Response(JSON.stringify({
      ...result,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ticketmaster-prices-updater] Fatal error:", error);
    
    return new Response(JSON.stringify({
      error: String(error),
      processed: 0,
      remaining: -1,
      success: 0,
      failed: 0,
      reset: 0,
      details: [],
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
