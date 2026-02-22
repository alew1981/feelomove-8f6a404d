-- Fix event dates for events with placeholder 9999-12-31 dates
UPDATE tm_tbl_events SET event_date = '2026-07-27 00:00:00+00', updated_at = now() WHERE id = '481477511';
UPDATE tm_tbl_events SET event_date = '2026-07-03 00:00:00+00', updated_at = now() WHERE id = '1104066323';
UPDATE tm_tbl_events SET event_date = '2026-07-03 00:00:00+00', updated_at = now() WHERE id = '831346118';
UPDATE tm_tbl_events SET event_date = '2026-07-03 00:00:00+00', updated_at = now() WHERE id = '2091057808';
UPDATE tm_tbl_events SET event_date = '2026-04-18 00:00:00+00', updated_at = now() WHERE id = '704898737';

-- Refresh the materialized view so schema_org picks up the new dates
REFRESH MATERIALIZED VIEW mv_events_schema_org;