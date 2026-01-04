-- Refresh only the views that exist for this project
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_concerts_cards;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_festivals_cards;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_destinations_cards;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_attractions;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_genres_cards;
REFRESH MATERIALIZED VIEW CONCURRENTLY lovable_mv_event_product_page;
REFRESH MATERIALIZED VIEW CONCURRENTLY lovable_mv_event_product_page_conciertos;
REFRESH MATERIALIZED VIEW CONCURRENTLY lovable_mv_event_product_page_festivales;