
-- Fix: Delete obsolete redirect entries where old_slug now exists as a valid event slug
-- These entries cause incorrect redirects because the old_slug has been reassigned to a new event

DELETE FROM public.slug_redirects 
WHERE old_slug IN (
  SELECT slug FROM public.tm_tbl_events WHERE slug IS NOT NULL
);

-- Log the cleanup for reference
COMMENT ON TABLE public.slug_redirects IS 'Stores legacy URL redirects. Entries are auto-cleaned when old_slug is reassigned to a new event.';
