-- Create index on created_at for faster sorting by recently added
CREATE INDEX IF NOT EXISTS idx_tm_tbl_events_created_at_desc 
ON tm_tbl_events (created_at DESC NULLS LAST);

-- Composite index for common query pattern: future events ordered by created_at
CREATE INDEX IF NOT EXISTS idx_tm_tbl_events_future_created 
ON tm_tbl_events (event_date, created_at DESC) 
WHERE cancelled = false AND is_transport = false;

-- Composite index for festival queries
CREATE INDEX IF NOT EXISTS idx_tm_tbl_events_festival_created 
ON tm_tbl_events (created_at DESC, event_date) 
WHERE cancelled = false;