import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch Schema.org JSON-LD from mv_events_schema_org and inject it into the document head
 * @param eventSlug - The event slug to fetch schema for
 */
export const useSchemaOrg = (eventSlug: string | undefined) => {
  useEffect(() => {
    if (!eventSlug) return;

    let isMounted = true;

    const fetchSchema = async () => {
      try {
        const { data, error } = await supabase
          .from('mv_events_schema_org')
          .select('schema_org_json')
          .eq('slug', eventSlug)
          .single();

        if (error) {
          console.warn('Schema.org fetch error:', error.message);
          return;
        }

        if (data?.schema_org_json && isMounted) {
          // Clean up existing script if present
          const existingScript = document.getElementById('event-schema-org');
          if (existingScript) {
            existingScript.remove();
          }

          // Create and inject the JSON-LD script
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.id = 'event-schema-org';
          script.text = JSON.stringify(data.schema_org_json);
          document.head.appendChild(script);
        }
      } catch (err) {
        console.warn('Schema.org injection failed:', err);
      }
    };

    fetchSchema();

    // Cleanup on unmount or slug change
    return () => {
      isMounted = false;
      const schemaScript = document.getElementById('event-schema-org');
      if (schemaScript) {
        schemaScript.remove();
      }
    };
  }, [eventSlug]);
};
