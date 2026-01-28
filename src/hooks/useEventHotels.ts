import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HotelData {
  hotel_id: string;
  hotel_name: string;
  hotel_main_photo: string;
  hotel_description: string;
  hotel_stars: number;
  hotel_rating: number;
  hotel_reviews: number;
  price: number;
  selling_price: number;
  distance_km: number;
  facility_names_es?: string[];
  checkin_date?: string;
  checkout_date?: string;
  nights?: number;
  hotel_address?: string;
  hotel_city?: string;
}

interface UseEventHotelsOptions {
  eventId: string | null | undefined;
  venueLatitude?: number | null;
  venueLongitude?: number | null;
  enabled?: boolean;
}

/**
 * Hook to fetch hotels for a specific event
 * Queries lite_tbl_event_hotel_prices joined with lite_tbl_hotels
 * and calculates distance from venue if coordinates available
 */
export function useEventHotels({ 
  eventId, 
  venueLatitude, 
  venueLongitude, 
  enabled = true 
}: UseEventHotelsOptions) {
  return useQuery({
    queryKey: ["event-hotels", eventId],
    queryFn: async (): Promise<HotelData[]> => {
      if (!eventId) return [];

      // Query hotels with prices for this event
      const { data: hotelPrices, error } = await supabase
        .from("lite_tbl_event_hotel_prices")
        .select(`
          hotel_id,
          min_price,
          suggested_selling_price,
          checkin_date,
          checkout_date,
          nights,
          is_available
        `)
        .eq("event_id", eventId)
        .eq("is_available", true)
        .order("suggested_selling_price", { ascending: true })
        .limit(20);

      if (error) {
        console.error("Error fetching hotel prices:", error);
        return [];
      }

      if (!hotelPrices || hotelPrices.length === 0) return [];

      // Get unique hotel IDs
      const hotelIds = [...new Set(hotelPrices.map(p => p.hotel_id))];

      // Fetch hotel details from v_lite_tbl_hotels view (has normalized facility names)
      const { data: hotels, error: hotelsError } = await supabase
        .from("v_lite_tbl_hotels")
        .select(`
          id,
          name,
          main_photo,
          thumbnail,
          hotel_description,
          stars,
          rating,
          review_count,
          address,
          city,
          latitude,
          longitude,
          facility_names_es
        `)
        .in("id", hotelIds)
        .eq("active", true);

      if (hotelsError) {
        console.error("Error fetching hotels:", hotelsError);
        return [];
      }

      // Create hotel map for quick lookup
      const hotelMap = new Map(hotels?.map(h => [h.id, h]) || []);

      // Calculate distance using Haversine formula
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Merge prices with hotel details
      const mergedHotels: HotelData[] = hotelPrices
        .map(price => {
          const hotel = hotelMap.get(price.hotel_id);
          if (!hotel) return null;

          // Calculate distance if venue and hotel coordinates available
          let distance_km = 0;
          if (venueLatitude && venueLongitude && hotel.latitude && hotel.longitude) {
            distance_km = calculateDistance(
              venueLatitude,
              venueLongitude,
              Number(hotel.latitude),
              Number(hotel.longitude)
            );
          }

          return {
            hotel_id: hotel.id,
            hotel_name: hotel.name,
            hotel_main_photo: hotel.main_photo || hotel.thumbnail || "/placeholder.svg",
            hotel_description: hotel.hotel_description || "Hotel confortable cerca del venue",
            hotel_stars: hotel.stars || 0,
            hotel_rating: Number(hotel.rating) || 0,
            hotel_reviews: hotel.review_count || 0,
            price: Number(price.min_price) || 0,
            selling_price: Number(price.suggested_selling_price) || Number(price.min_price) || 0,
            distance_km,
            facility_names_es: hotel.facility_names_es || [],
            checkin_date: price.checkin_date,
            checkout_date: price.checkout_date,
            nights: price.nights || 1,
            hotel_address: hotel.address || "",
          hotel_city: hotel.city || "",
        };
      })
      .filter((h): h is NonNullable<typeof h> => h !== null) as HotelData[];

      // Sort by distance if coordinates available, otherwise by price
      if (venueLatitude && venueLongitude) {
        mergedHotels.sort((a, b) => a.distance_km - b.distance_km);
      }

      return mergedHotels.slice(0, 12);
    },
    enabled: enabled && !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
