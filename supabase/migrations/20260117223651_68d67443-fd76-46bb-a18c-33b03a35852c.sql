-- Fix incorrect slug_redirects rows where canonical (new_slug) is a placeholder like -9999
-- Example bad row: old_slug = 'vida-festival-...' , new_slug = 'vida-festival-...-9999'
-- We set new_slug back to the clean slug (old_slug).

UPDATE public.slug_redirects
SET new_slug = old_slug
WHERE new_slug ~ '-9999(-[0-9]{2})?(-[0-9]{2})?$'
  AND old_slug !~ '-9999(-[0-9]{2})?(-[0-9]{2})?$';

-- Also normalize any rows that have placeholder in BOTH old and new by stripping it from new_slug
UPDATE public.slug_redirects
SET new_slug = regexp_replace(new_slug, '-9999(-[0-9]{2})?(-[0-9]{2})?$', '')
WHERE new_slug ~ '-9999(-[0-9]{2})?(-[0-9]{2})?$'
  AND old_slug ~ '-9999(-[0-9]{2})?(-[0-9]{2})?$';

-- Prevent future bad redirects: new_slug must never contain the placeholder suffix.
-- Use a trigger (avoid CHECK constraints for pattern/time-based validations).
CREATE OR REPLACE FUNCTION public.prevent_placeholder_new_slug_redirects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.new_slug ~ '-9999(-[0-9]{2})?(-[0-9]{2})?$' THEN
    RAISE EXCEPTION 'slug_redirects.new_slug cannot end with placeholder -9999: %', NEW.new_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_placeholder_new_slug_redirects ON public.slug_redirects;
CREATE TRIGGER trg_prevent_placeholder_new_slug_redirects
BEFORE INSERT OR UPDATE ON public.slug_redirects
FOR EACH ROW
EXECUTE FUNCTION public.prevent_placeholder_new_slug_redirects();
