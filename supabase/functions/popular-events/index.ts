import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=3600', // 1 hour CDN cache
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current hour for rotation (changes every hour)
    const currentHour = Math.floor(Date.now() / 3600000);
    
    // First, get total count to calculate rotation
    const { count: totalCount } = await supabase
      .from('mv_concerts_cards')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', new Date().toISOString())
      .not('slug', 'is', null);

    const eventsPerPage = 20;
    const totalPages = Math.ceil((totalCount || 1000) / eventsPerPage);
    
    // Calculate offset based on current hour (rotates through all events)
    const offset = (currentHour % totalPages) * eventsPerPage;

    // Fetch 20 events with hourly rotation
    const { data: events, error } = await supabase
      .from('mv_concerts_cards')
      .select('slug, artist_name, name')
      .gte('event_date', new Date().toISOString())
      .not('slug', 'is', null)
      .order('event_date', { ascending: true })
      .range(offset, offset + eventsPerPage - 1);

    if (error) {
      console.error('[popular-events] Query error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // If we got fewer than 20 events (near the end), wrap around to get more
    let finalEvents = events || [];
    if (finalEvents.length < eventsPerPage && offset > 0) {
      const { data: additionalEvents } = await supabase
        .from('mv_concerts_cards')
        .select('slug, artist_name, name')
        .gte('event_date', new Date().toISOString())
        .not('slug', 'is', null)
        .order('event_date', { ascending: true })
        .limit(eventsPerPage - finalEvents.length);
      
      finalEvents = [...finalEvents, ...(additionalEvents || [])];
    }

    console.log(`[popular-events] Returning ${finalEvents.length} events (hour: ${currentHour % 24}, offset: ${offset})`);

    return new Response(
      JSON.stringify(finalEvents),
      { headers: corsHeaders }
    );

  } catch (err) {
    console.error('[popular-events] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
