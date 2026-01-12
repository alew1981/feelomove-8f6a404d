// Types for Materialized Views

export interface EventCard {
  id: string;
  slug: string;
  name: string;
  event_type: 'concert' | 'festival';
  is_festival: boolean;
  event_date: string;
  day_of_week: string;
  image_large_url: string;
  image_standard_url: string;
  venue_name: string;
  venue_city: string;
  venue_country: string;
  primary_attraction_id: string;
  primary_attraction_name: string;
  secondary_attraction_name: string | null;
  attraction_names: string[];
  primary_category_name: string;
  primary_subcategory_name: string;
  price_min_incl_fees: number | null;
  price_max_incl_fees: number | null;
  currency: string;
  sold_out: boolean;
  seats_available: boolean;
  url: string;
  badges: string[];
  local_event_date?: string;
}

export interface ConcertCard {
  id: string;
  slug: string;
  name: string;
  event_date: string;
  day_of_week: string;
  image_large_url: string;
  image_standard_url: string;
  venue_name: string;
  venue_city: string;
  artist_name: string;
  genre: string;
  price_min_incl_fees: number | null;
  price_max_incl_fees: number | null;
  currency: string;
  sold_out: boolean;
  seats_available: boolean;
  url: string;
  badges: string[];
  local_event_date?: string;
}

export interface FestivalCard {
  id: string;
  slug: string;
  name: string;
  event_date: string;
  day_of_week: string;
  image_large_url: string;
  image_standard_url: string;
  venue_name: string;
  venue_city: string;
  main_attraction: string;
  secondary_attraction_name: string | null;
  attraction_names: string[];
  price_min_incl_fees: number | null;
  price_max_incl_fees: number | null;
  currency: string;
  sold_out: boolean;
  seats_available: boolean;
  url: string;
  badges: string[];
  local_event_date?: string;
}

export interface GenreCard {
  genre_id: number;
  genre_name: string;
  event_count: number;
  next_event_date: string;
  cities: string[];
  sample_image_url: string;
}

export interface DestinationCard {
  city_name: string;
  event_count: number;
  concerts_count: number;
  festivals_count: number;
  next_event_date: string;
  genres: string[];
  sample_image_url: string;
  price_from: number | null;
  price_to: number | null;
}

export interface ArtistCard {
  artist_id: string;
  artist_slug: string;
  artist_name: string;
  image_url: string;
  genre: string;
  event_count: number;
  upcoming_events_count: number;
  next_event_date: string | null;
  cities: string[] | null;
}

export interface TicketType {
  availability: string;
  code: string;
  description: string;
  face_value: number;
  fees: number;
  name: string;
  total: number;
}

// Base interface for common event product page fields
// Updated to match optimized materialized views (removed unused fields)
export interface BaseEventProductPage {
  is_festival?: boolean;
  event_id: string;
  event_slug: string;
  event_name: string;
  event_type: 'concert' | 'festival';
  event_date: string;
  timezone: string;
  day_of_week: string;
  event_url: string;
  venue_name: string;
  venue_city: string;
  venue_address: string;
  venue_postal_code: string;
  venue_country: string;
  venue_latitude: number;
  venue_longitude: number;
  venue_url?: string;
  primary_attraction_id: string;
  primary_attraction_name: string;
  secondary_attraction_name: string | null;
  attraction_ids: string[];
  attraction_names: string[];
  primary_category_name: string;
  primary_subcategory_name: string;
  image_large_url: string;
  image_standard_url: string;
  cancelled: boolean;
  sold_out: boolean;
  rescheduled: boolean;
  seats_available: boolean;
  has_real_availability: boolean;
  is_transport: boolean;
  is_package: boolean;
  ticket_types: unknown;
  event_currency: string;
  price_min_incl_fees: number | null;
  ticket_price_min: number | null;
  has_vip_tickets: boolean;
  event_season: string;
  on_sale_date: string;
  off_sale_date: string;
  minimum_age_required: number | null;
  seo_title: string;
  meta_description: string;
  seo_keywords: string[];
  destination_deeplink: string | null;
  stay22_map_general: string | null;
  hotels_prices_aggregated_jsonb: unknown | null;
  min_hotel_price: number | null;
}

// Concert-specific product page (no additional fields beyond base)
export interface ConcertProductPage extends BaseEventProductPage {
  event_type: 'concert';
}

// Festival-specific product page with additional fields
export interface FestivalProductPage extends BaseEventProductPage {
  event_type: 'festival';
  // Festival-specific fields from lovable_mv_event_product_page_festivales
  festival_start_date: string;
  festival_end_date: string;
  festival_duration_days: number;
  festival_lineup_artists: string[];
  festival_lineup_artist_ids: string[];
  festival_headliners: string[] | null;
  festival_total_artists: number;
  festival_stages: string[] | null;
  festival_total_stages: number | null;
  festival_transport_event_ids: string[] | null;
  festival_has_official_transport: boolean;
  festival_available_transport_options: number;
  festival_camping_available: boolean;
  has_festival_pass: boolean;
  has_daily_tickets: boolean;
  has_camping_tickets: boolean;
  has_parking_tickets: boolean;
}

// Union type for any event product page
export type EventProductPage = ConcertProductPage | FestivalProductPage;

// Type guards
export function isFestivalProductPage(event: EventProductPage): event is FestivalProductPage {
  return event.event_type === 'festival';
}

export function isConcertProductPage(event: EventProductPage): event is ConcertProductPage {
  return event.event_type === 'concert';
}

// Legacy interface (for backward compatibility with lovable_mv_event_product_page)
export interface LegacyEventProductPage {
  event_id: string;
  event_slug: string;
  event_name: string;
  event_type: 'concert' | 'festival';
  is_festival: boolean;
  event_date: string;
  local_event_date: string;
  day_of_week: string;
  timezone: string;
  event_image_large: string;
  event_image_standard: string;
  cancelled: boolean;
  sold_out: boolean;
  seats_available: boolean;
  schedule_status: string;
  on_sale_date: string;
  off_sale_date: string;
  venue_id: string;
  venue_name: string;
  venue_city: string;
  venue_address: string;
  venue_postal_code: string;
  venue_latitude: number;
  venue_longitude: number;
  primary_attraction_id: string;
  primary_attraction_name: string;
  secondary_attraction_id: string | null;
  secondary_attraction_name: string | null;
  attraction_names: string[];
  primary_category_name: string;
  primary_subcategory_name: string;
  event_ticketmaster_url: string;
  event_badges: string[];
  
  // Ticket prices
  ticket_price_min: number | null;
  ticket_price_max: number | null;
  ticket_types: TicketType[];
  ticket_currency: string;
  
  // Hotel
  hotel_id: string;
  hotel_slug: string;
  hotel_name: string;
  hotel_city: string;
  hotel_address: string;
  hotel_latitude: number;
  hotel_longitude: number;
  hotel_stars: number;
  hotel_rating: number;
  hotel_reviews: number;
  hotel_chain: string;
  hotel_type: string;
  hotel_main_photo: string;
  hotel_thumbnail: string;
  hotel_description: string;
  hotel_important_information: string;
  pets_allowed: boolean;
  child_allowed: boolean;
  parking_available: boolean;
  parking_type: string;
  parking_price: number;
  checkin_time: string;
  checkout_time: string;
  hotel_badges: string[];
  
  // Sentiments
  sentiment_overall: number;
  sentiment_location: number;
  sentiment_cleanliness: number;
  sentiment_service: number;
  sentiment_value: number;
  sentiment_room_quality: number;
  sentiment_amenities: number;
  sentiment_food: number;
  sentiment_pros: string[];
  sentiment_cons: string[];
  hotel_facilities: number[];
  
  // Package
  package_checkin: string;
  package_checkout: string;
  package_nights: number;
  hotel_min_price: number;
  hotel_selling_price: number;
  package_adults: number;
  package_children: number;
  hotel_currency: string;
  package_available: boolean;
  price_updated_at: string;
  
  // Calculations
  distance_km: number;
  distance_badge: string | null;
  total_package_price: number;
}
