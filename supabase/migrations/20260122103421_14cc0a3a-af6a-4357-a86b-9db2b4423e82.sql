-- Add manual lineup column to separate manual data from automated ETL data
ALTER TABLE public.tm_tbl_festival_details 
ADD COLUMN IF NOT EXISTS lineup_artists_manual TEXT[] DEFAULT NULL;

-- Add comment to clarify usage
COMMENT ON COLUMN public.tm_tbl_festival_details.lineup_artists_manual IS 'Manually curated lineup artists - will NOT be overwritten by ETL processes';