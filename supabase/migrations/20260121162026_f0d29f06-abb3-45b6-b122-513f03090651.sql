-- Create index for faster redirect lookups if not exists
CREATE INDEX IF NOT EXISTS idx_slug_redirects_old_slug ON slug_redirects(old_slug);
CREATE INDEX IF NOT EXISTS idx_tm_events_slug ON tm_tbl_events(slug);