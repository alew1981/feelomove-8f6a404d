
-- Add missing translations for artist detail, inspiration, destinations, genre badges, filters
INSERT INTO public.tm_translations (spanish_text, english_text, field_type) VALUES
-- Artist detail hero description
('Conciertos y Entradas', 'Concerts & Tickets', 'ui'),
('Descubre todos los conciertos de', 'Discover all concerts by', 'ui'),
('en España. Tenemos', 'in Spain. We have', 'ui'),
('eventos confirmados en', 'confirmed events in', 'ui'),
('ciudades diferentes. El próximo concierto será el', 'different cities. The next concert will be on', 'ui'),
('¡No te pierdas la oportunidad de ver a', 'Don''t miss the chance to see', 'ui'),
('en directo!', 'live!', 'ui'),
('También te puede interesar', 'You may also like', 'ui'),
('Géneros musicales', 'Music genres', 'ui'),
('Hoteles en destinos con eventos', 'Hotels in event destinations', 'ui'),
('Destinos de', 'Destinations for', 'ui'),
('Artistas relacionados', 'Related artists', 'ui'),
-- Genre badges
('Festival de Música', 'Music Festival', 'genre'),
('Festival de música', 'Music Festival', 'ui'),
-- Inspiration page
('Inspírate', 'Get inspired', 'ui'),
('para tu próximo viaje', 'for your next trip', 'ui'),
('Ofertas exclusivas de conciertos y festivales con hotel incluido.', 'Exclusive concert and festival deals with hotel included.', 'ui'),
('Experiencias completas al mejor precio.', 'Complete experiences at the best price.', 'ui'),
('Packs de Concierto + Hotel: Tu Escapada Musical Perfecta', 'Concert + Hotel Packs: Your Perfect Musical Getaway', 'ui'),
('Ver Oferta', 'View Deal', 'ui'),
('Hotel & Entrada:', 'Hotel & Ticket:', 'ui'),
('para 2pers.', 'for 2 people', 'ui'),
('/ pers.', '/ person', 'ui'),
('Error al cargar las ofertas. Inténtalo de nuevo.', 'Error loading deals. Please try again.', 'ui'),
('No hay ofertas disponibles en este momento.', 'No deals available at the moment.', 'ui'),
('Vuelve pronto para descubrir nuevas experiencias.', 'Come back soon to discover new experiences.', 'ui'),
('Ver oferta', 'View deal', 'ui'),
-- Destinations page
('Destinos Musicales en España', 'Music Destinations in Spain', 'ui'),
('Conciertos y festivales por ciudad', 'Concerts and festivals by city', 'ui'),
('Ciudades destacadas con eventos musicales en España', 'Featured cities with music events in Spain', 'ui'),
('Explora eventos musicales en las mejores ciudades de España.', 'Explore music events in the best cities in Spain.', 'ui'),
('Descubrir eventos en', 'Discover events in', 'ui'),
('No se encontraron destinos', 'No destinations found', 'ui'),
('Buscar destino...', 'Search destination...', 'ui'),
-- Destination detail page
('Conciertos y Festivales en', 'Concerts and Festivals in', 'ui'),
('Temporada', 'Season', 'ui'),
('Cargando la programación musical de', 'Loading the music schedule for', 'ui'),
('disponibles', 'available', 'ui'),
('próximos', 'upcoming', 'ui'),
('Entradas desde', 'Tickets from', 'ui'),
('Actualmente no hay eventos programados en', 'There are currently no events scheduled in', 'ui'),
('Consulta otras ciudades cercanas o vuelve pronto para nuevas fechas.', 'Check other nearby cities or come back soon for new dates.', 'ui'),
('Buscar eventos o artistas...', 'Search events or artists...', 'ui'),
('Buscar eventos o ciudades...', 'Search events or cities...', 'ui'),
('Conciertos en', 'Concerts in', 'ui'),
('Entradas y Hoteles', 'Tickets & Hotels', 'ui'),
-- Filter labels
('Ordenar por', 'Sort by', 'ui'),
('Todos los artistas', 'All artists', 'ui'),
('Artista', 'Artist', 'ui'),
-- DestinationListCard
('conciertos', 'concerts', 'ui'),
('festivales', 'festivals', 'ui'),
('evento', 'event', 'ui'),
('Eventos en', 'Events in', 'ui'),
-- Destination desktop filters
('Limpiar filtros', 'Clear filters', 'ui'),
('Conciertos y gira en España', 'Concerts and tour in Spain', 'ui')
ON CONFLICT DO NOTHING;
