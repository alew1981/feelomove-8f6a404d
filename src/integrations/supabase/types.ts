export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          domain_id: string
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain_id: string
          id: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain_id?: string
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_id: number | null
          created_at: string | null
          domain_id: string
          id: number
          name: string
          region_id: number | null
          region_name: string | null
          updated_at: string | null
        }
        Insert: {
          country_id?: number | null
          created_at?: string | null
          domain_id: string
          id: number
          name: string
          region_id?: number | null
          region_name?: string | null
          updated_at?: string | null
        }
        Update: {
          country_id?: number | null
          created_at?: string | null
          domain_id?: string
          id?: number
          name?: string
          region_id?: number | null
          region_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cities_country"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      city_events: {
        Row: {
          cancelled: boolean | null
          category_name: string | null
          city_latitude: number | null
          city_longitude: number | null
          city_name: string
          city_slug: string
          country: string
          created_at: string
          currency: string | null
          event_date: string | null
          event_id: string
          event_name: string
          event_url: string | null
          id: string
          image_url: string | null
          is_future: boolean
          max_price: number | null
          min_price: number | null
          sold_out: boolean | null
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          cancelled?: boolean | null
          category_name?: string | null
          city_latitude?: number | null
          city_longitude?: number | null
          city_name: string
          city_slug: string
          country?: string
          created_at?: string
          currency?: string | null
          event_date?: string | null
          event_id: string
          event_name: string
          event_url?: string | null
          id?: string
          image_url?: string | null
          is_future?: boolean
          max_price?: number | null
          min_price?: number | null
          sold_out?: boolean | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          cancelled?: boolean | null
          category_name?: string | null
          city_latitude?: number | null
          city_longitude?: number | null
          city_name?: string
          city_slug?: string
          country?: string
          created_at?: string
          currency?: string | null
          event_date?: string | null
          event_id?: string
          event_name?: string
          event_url?: string | null
          id?: string
          image_url?: string | null
          is_future?: boolean
          max_price?: number | null
          min_price?: number | null
          sold_out?: boolean | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      city_summary: {
        Row: {
          city_latitude: number | null
          city_longitude: number | null
          city_name: string
          city_slug: string
          country: string
          id: string
          meta_description: string | null
          meta_title: string | null
          next_event_date: string | null
          next_event_id: string | null
          next_event_name: string | null
          total_events: number
          upcoming_events: number
          updated_at: string
        }
        Insert: {
          city_latitude?: number | null
          city_longitude?: number | null
          city_name: string
          city_slug: string
          country?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          next_event_date?: string | null
          next_event_id?: string | null
          next_event_name?: string | null
          total_events?: number
          upcoming_events?: number
          updated_at?: string
        }
        Update: {
          city_latitude?: number | null
          city_longitude?: number | null
          city_name?: string
          city_slug?: string
          country?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          next_event_date?: string | null
          next_event_id?: string | null
          next_event_name?: string | null
          total_events?: number
          upcoming_events?: number
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          created_at: string | null
          domain_id: string
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain_id: string
          id: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain_id?: string
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "countries_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          country_id: number | null
          created_at: string | null
          currency: string | null
          id: string
          langs: Json | null
          name: string
          short_code: string | null
          site_url: string | null
          updated_at: string | null
        }
        Insert: {
          country_id?: number | null
          created_at?: string | null
          currency?: string | null
          id: string
          langs?: Json | null
          name: string
          short_code?: string | null
          site_url?: string | null
          updated_at?: string | null
        }
        Update: {
          country_id?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          langs?: Json | null
          name?: string
          short_code?: string | null
          site_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_details_page_hotels_view: {
        Row: {
          address: string | null
          adults: number | null
          available: boolean | null
          chain: string | null
          checkin_date: string | null
          checkout_date: string | null
          city: string
          country: string
          created_at: string | null
          currency: string | null
          distance_to_city_center: number | null
          distance_to_venue: number | null
          event_id: string
          facility_descriptions: string[] | null
          facility_ids: number[] | null
          guest_nationality: string | null
          hotel_description: string | null
          hotel_id: string
          hotel_important_information: string | null
          hotel_name: string
          hotel_rank: number | null
          hotel_type: string | null
          last_checked_at: string | null
          latitude: number | null
          longitude: number | null
          main_photo: string | null
          nights: number | null
          price: number | null
          price_date: string | null
          rating: number | null
          review_count: number | null
          search_radius: number | null
          stars: number | null
          suggested_selling_price: number | null
          suitable_for_events: boolean | null
          thumbnail: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          adults?: number | null
          available?: boolean | null
          chain?: string | null
          checkin_date?: string | null
          checkout_date?: string | null
          city: string
          country: string
          created_at?: string | null
          currency?: string | null
          distance_to_city_center?: number | null
          distance_to_venue?: number | null
          event_id: string
          facility_descriptions?: string[] | null
          facility_ids?: number[] | null
          guest_nationality?: string | null
          hotel_description?: string | null
          hotel_id: string
          hotel_important_information?: string | null
          hotel_name: string
          hotel_rank?: number | null
          hotel_type?: string | null
          last_checked_at?: string | null
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          nights?: number | null
          price?: number | null
          price_date?: string | null
          rating?: number | null
          review_count?: number | null
          search_radius?: number | null
          stars?: number | null
          suggested_selling_price?: number | null
          suitable_for_events?: boolean | null
          thumbnail?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          adults?: number | null
          available?: boolean | null
          chain?: string | null
          checkin_date?: string | null
          checkout_date?: string | null
          city?: string
          country?: string
          created_at?: string | null
          currency?: string | null
          distance_to_city_center?: number | null
          distance_to_venue?: number | null
          event_id?: string
          facility_descriptions?: string[] | null
          facility_ids?: number[] | null
          guest_nationality?: string | null
          hotel_description?: string | null
          hotel_id?: string
          hotel_important_information?: string | null
          hotel_name?: string
          hotel_rank?: number | null
          hotel_type?: string | null
          last_checked_at?: string | null
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          nights?: number | null
          price?: number | null
          price_date?: string | null
          rating?: number | null
          review_count?: number | null
          search_radius?: number | null
          stars?: number | null
          suggested_selling_price?: number | null
          suitable_for_events?: boolean | null
          thumbnail?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      hotel_event_prices: {
        Row: {
          adults: number
          available: boolean
          checkin_date: string
          checkout_date: string
          created_at: string
          currency: string
          distance_to_venue: number | null
          event_id: string
          guest_nationality: string
          hotel_id: string
          id: string
          last_checked_at: string
          price: number | null
          price_date: string
          search_radius: number | null
          suggested_selling_price: number | null
          updated_at: string
        }
        Insert: {
          adults?: number
          available?: boolean
          checkin_date: string
          checkout_date: string
          created_at?: string
          currency?: string
          distance_to_venue?: number | null
          event_id: string
          guest_nationality?: string
          hotel_id: string
          id?: string
          last_checked_at?: string
          price?: number | null
          price_date?: string
          search_radius?: number | null
          suggested_selling_price?: number | null
          updated_at?: string
        }
        Update: {
          adults?: number
          available?: boolean
          checkin_date?: string
          checkout_date?: string
          created_at?: string
          currency?: string
          distance_to_venue?: number | null
          event_id?: string
          guest_nationality?: string
          hotel_id?: string
          id?: string
          last_checked_at?: string
          price?: number | null
          price_date?: string
          search_radius?: number | null
          suggested_selling_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_event_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "attractions_with_events_complete"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_details_web"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hotels_available"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_list_page_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_hotel_prices"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticketmaster_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_price_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_with_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "event_hotels_available"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_event_prices_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels_with_event_availability"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "hotel_event_prices_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels_with_event_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_facilities: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id: number
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotel_facility_mapping: {
        Row: {
          created_at: string
          facility_id: number
          hotel_id: string
        }
        Insert: {
          created_at?: string
          facility_id: number
          hotel_id: string
        }
        Update: {
          created_at?: string
          facility_id?: number
          hotel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_facility_mapping_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "hotel_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_facility_mapping_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "event_hotels_available"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "hotel_facility_mapping_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_facility_mapping_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels_with_event_availability"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "hotel_facility_mapping_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels_with_event_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_price_extraction_progress: {
        Row: {
          avg_price_found: number | null
          city_for_hotels: string | null
          completed_at: string | null
          created_at: string
          event_date: string | null
          event_id: string
          event_name: string | null
          extraction_status: string | null
          hotels_processed: number | null
          hotels_with_prices: number | null
          hotels_without_availability: number | null
          last_error: string | null
          max_price_found: number | null
          min_price_found: number | null
          started_at: string | null
          total_hotels_found: number | null
          updated_at: string
        }
        Insert: {
          avg_price_found?: number | null
          city_for_hotels?: string | null
          completed_at?: string | null
          created_at?: string
          event_date?: string | null
          event_id: string
          event_name?: string | null
          extraction_status?: string | null
          hotels_processed?: number | null
          hotels_with_prices?: number | null
          hotels_without_availability?: number | null
          last_error?: string | null
          max_price_found?: number | null
          min_price_found?: number | null
          started_at?: string | null
          total_hotels_found?: number | null
          updated_at?: string
        }
        Update: {
          avg_price_found?: number | null
          city_for_hotels?: string | null
          completed_at?: string | null
          created_at?: string
          event_date?: string | null
          event_id?: string
          event_name?: string | null
          extraction_status?: string | null
          hotels_processed?: number | null
          hotels_with_prices?: number | null
          hotels_without_availability?: number | null
          last_error?: string | null
          max_price_found?: number | null
          min_price_found?: number | null
          started_at?: string | null
          total_hotels_found?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_price_extraction_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "attractions_with_events_complete"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_price_extraction_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_details_web"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_price_extraction_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hotels_available"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_price_extraction_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_list_page_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_price_extraction_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events_with_hotel_prices"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_price_extraction_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "ticketmaster_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_price_extraction_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "v_event_price_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "hotel_price_extraction_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "v_events_with_details"
            referencedColumns: ["event_id"]
          },
        ]
      }
      hotel_sync_progress: {
        Row: {
          city_id: number
          city_name: string
          country_code: string
          created_at: string
          error_message: string | null
          failed_hotels: number | null
          last_sync_at: string | null
          next_sync_due: string | null
          processed_hotels: number | null
          successful_hotels: number | null
          sync_status: string | null
          total_hotels: number | null
          updated_at: string
        }
        Insert: {
          city_id: number
          city_name: string
          country_code: string
          created_at?: string
          error_message?: string | null
          failed_hotels?: number | null
          last_sync_at?: string | null
          next_sync_due?: string | null
          processed_hotels?: number | null
          successful_hotels?: number | null
          sync_status?: string | null
          total_hotels?: number | null
          updated_at?: string
        }
        Update: {
          city_id?: number
          city_name?: string
          country_code?: string
          created_at?: string
          error_message?: string | null
          failed_hotels?: number | null
          last_sync_at?: string | null
          next_sync_due?: string | null
          processed_hotels?: number | null
          successful_hotels?: number | null
          sync_status?: string | null
          total_hotels?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_sync_progress_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_sync_progress_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities_with_hotel_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          accessibility_attributes: Json | null
          address: string | null
          chain: string | null
          chain_id: number | null
          city: string
          city_id: number | null
          country: string
          created_at: string
          currency: string
          deleted_at: string | null
          distance_to_city_center: number | null
          facility_ids: number[] | null
          hotel_description: string | null
          hotel_important_information: string | null
          hotel_type: string | null
          hotel_type_id: number | null
          id: string
          last_sync_at: string | null
          latitude: number | null
          longitude: number | null
          main_photo: string | null
          name: string
          rating: number | null
          review_count: number | null
          stars: number | null
          suitable_for_events: boolean | null
          thumbnail: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          accessibility_attributes?: Json | null
          address?: string | null
          chain?: string | null
          chain_id?: number | null
          city: string
          city_id?: number | null
          country: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          distance_to_city_center?: number | null
          facility_ids?: number[] | null
          hotel_description?: string | null
          hotel_important_information?: string | null
          hotel_type?: string | null
          hotel_type_id?: number | null
          id: string
          last_sync_at?: string | null
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          name: string
          rating?: number | null
          review_count?: number | null
          stars?: number | null
          suitable_for_events?: boolean | null
          thumbnail?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          accessibility_attributes?: Json | null
          address?: string | null
          chain?: string | null
          chain_id?: number | null
          city?: string
          city_id?: number | null
          country?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          distance_to_city_center?: number | null
          facility_ids?: number[] | null
          hotel_description?: string | null
          hotel_important_information?: string | null
          hotel_type?: string | null
          hotel_type_id?: number | null
          id?: string
          last_sync_at?: string | null
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          name?: string
          rating?: number | null
          review_count?: number | null
          stars?: number | null
          suitable_for_events?: boolean | null
          thumbnail?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_with_hotel_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      pagination_progress: {
        Row: {
          batch_size: number | null
          current_offset: number | null
          domain_id: string
          is_completed: boolean | null
          last_processed_at: string | null
          process_type: string
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          batch_size?: number | null
          current_offset?: number | null
          domain_id: string
          is_completed?: boolean | null
          last_processed_at?: string | null
          process_type: string
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_size?: number | null
          current_offset?: number | null
          domain_id?: string
          is_completed?: boolean | null
          last_processed_at?: string | null
          process_type?: string
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          cities: Json | null
          cities_count: number | null
          country_id: number | null
          created_at: string | null
          id: number
          main_city: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          cities?: Json | null
          cities_count?: number | null
          country_id?: number | null
          created_at?: string | null
          id: number
          main_city?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          cities?: Json | null
          cities_count?: number | null
          country_id?: number | null
          created_at?: string | null
          id?: number
          main_city?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: number
          created_at: string | null
          domain_id: string
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id: number
          created_at?: string | null
          domain_id: string
          id: number
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: number
          created_at?: string | null
          domain_id?: string
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subcategories_category"
            columns: ["category_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "domain_id"]
          },
          {
            foreignKeyName: "subcategories_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_control: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          last_sync_at: string | null
          next_sync_due: string | null
          records_processed: number | null
          sync_frequency_hours: number | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          last_sync_at?: string | null
          next_sync_due?: string | null
          records_processed?: number | null
          sync_frequency_hours?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          last_sync_at?: string | null
          next_sync_due?: string | null
          records_processed?: number | null
          sync_frequency_hours?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticketmaster_attraction_details: {
        Row: {
          attraction_id: string
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          details_processed: boolean | null
          domain: string
          event_count: number | null
          genre: string | null
          has_images: boolean | null
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_height: number | null
          image_standard_url: string | null
          image_standard_width: number | null
          image_vga_height: number | null
          image_vga_url: string | null
          image_vga_width: number | null
          last_updated_from_api: string | null
          name: string
          subcategory_id: string | null
          subcategory_name: string | null
          subgenre: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          attraction_id: string
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          description?: string | null
          details_processed?: boolean | null
          domain: string
          event_count?: number | null
          genre?: string | null
          has_images?: boolean | null
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          image_vga_height?: number | null
          image_vga_url?: string | null
          image_vga_width?: number | null
          last_updated_from_api?: string | null
          name: string
          subcategory_id?: string | null
          subcategory_name?: string | null
          subgenre?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          attraction_id?: string
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          description?: string | null
          details_processed?: boolean | null
          domain?: string
          event_count?: number | null
          genre?: string | null
          has_images?: boolean | null
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          image_vga_height?: number | null
          image_vga_url?: string | null
          image_vga_width?: number | null
          last_updated_from_api?: string | null
          name?: string
          subcategory_id?: string | null
          subcategory_name?: string | null
          subgenre?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attraction_details_attraction"
            columns: ["attraction_id"]
            isOneToOne: true
            referencedRelation: "attractions_with_events_complete"
            referencedColumns: ["attraction_id"]
          },
          {
            foreignKeyName: "fk_attraction_details_attraction"
            columns: ["attraction_id"]
            isOneToOne: true
            referencedRelation: "ticketmaster_attractions"
            referencedColumns: ["attraction_id"]
          },
          {
            foreignKeyName: "fk_attraction_details_domain"
            columns: ["domain"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketmaster_attraction_details_scan_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          consecutive_errors: number | null
          current_position: number | null
          domain: string
          failed_attractions: number | null
          has_more: boolean | null
          last_rate_limit_available: number | null
          last_run_at: string | null
          processed_attractions: number | null
          started_at: string | null
          successful_attractions: number | null
          total_attractions: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_position?: number | null
          domain: string
          failed_attractions?: number | null
          has_more?: boolean | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_attractions?: number | null
          started_at?: string | null
          successful_attractions?: number | null
          total_attractions?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_position?: number | null
          domain?: string
          failed_attractions?: number | null
          has_more?: boolean | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_attractions?: number | null
          started_at?: string | null
          successful_attractions?: number | null
          total_attractions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attraction_details_scan_progress_domain"
            columns: ["domain"]
            isOneToOne: true
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketmaster_attractions: {
        Row: {
          attraction_id: string
          category_id: string | null
          category_name: string | null
          created_at: string | null
          domain: string
          event_count: number | null
          has_images: boolean | null
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_height: number | null
          image_standard_url: string | null
          image_standard_width: number | null
          last_updated_from_api: string | null
          name: string
          "Slug artista event details page": string | null
          subcategory_id: string | null
          subcategory_name: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          attraction_id: string
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          domain: string
          event_count?: number | null
          has_images?: boolean | null
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          last_updated_from_api?: string | null
          name: string
          "Slug artista event details page"?: string | null
          subcategory_id?: string | null
          subcategory_name?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          attraction_id?: string
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          domain?: string
          event_count?: number | null
          has_images?: boolean | null
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          last_updated_from_api?: string | null
          name?: string
          "Slug artista event details page"?: string | null
          subcategory_id?: string | null
          subcategory_name?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attractions_domain"
            columns: ["domain"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketmaster_attractions_scan_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          consecutive_errors: number | null
          current_start: number | null
          domain: string
          failed_attractions: number | null
          has_more: boolean | null
          last_rate_limit_available: number | null
          last_run_at: string | null
          processed_attractions: number | null
          started_at: string | null
          successful_attractions: number | null
          total_attractions: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_start?: number | null
          domain: string
          failed_attractions?: number | null
          has_more?: boolean | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_attractions?: number | null
          started_at?: string | null
          successful_attractions?: number | null
          total_attractions?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_start?: number | null
          domain?: string
          failed_attractions?: number | null
          has_more?: boolean | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_attractions?: number | null
          started_at?: string | null
          successful_attractions?: number | null
          total_attractions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attractions_scan_progress_domain"
            columns: ["domain"]
            isOneToOne: true
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketmaster_event_attractions: {
        Row: {
          attraction_id: string
          attraction_name: string | null
          attraction_order: number | null
          attraction_url: string | null
          created_at: string | null
          event_id: string
          id: number
        }
        Insert: {
          attraction_id: string
          attraction_name?: string | null
          attraction_order?: number | null
          attraction_url?: string | null
          created_at?: string | null
          event_id: string
          id?: number
        }
        Update: {
          attraction_id?: string
          attraction_name?: string | null
          attraction_order?: number | null
          attraction_url?: string | null
          created_at?: string | null
          event_id?: string
          id?: number
        }
        Relationships: []
      }
      ticketmaster_event_details: {
        Row: {
          cancelled: boolean | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          currency: string | null
          day_of_week: string | null
          details_fetched_at: string | null
          event_date: string | null
          event_id: string
          event_name: string | null
          event_url: string | null
          external_url: boolean | null
          has_detailed_info: boolean | null
          has_images: boolean | null
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_height: number | null
          image_standard_url: string | null
          image_standard_width: number | null
          is_package: boolean | null
          local_event_date: string | null
          main_attraction_id: string | null
          main_attraction_name: string | null
          main_attraction_rank: number | null
          main_attraction_url: string | null
          off_sale_date: string | null
          on_sale_date: string | null
          promoter_address_line_1: string | null
          promoter_city: string | null
          promoter_code: string | null
          promoter_country: string | null
          promoter_id: number | null
          promoter_name: string | null
          promoter_postal_code: string | null
          promoter_state: string | null
          rescheduled: boolean | null
          schedule_status: string | null
          seatmap_interactive_detailed: boolean | null
          seatmap_interactive_overview: boolean | null
          seatmap_static: boolean | null
          seats_available: boolean | null
          sold_out: boolean | null
          subcategory_id: string | null
          subcategory_name: string | null
          timezone: string | null
          updated_at: string | null
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_id: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
          venue_url: string | null
        }
        Insert: {
          cancelled?: boolean | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          currency?: string | null
          day_of_week?: string | null
          details_fetched_at?: string | null
          event_date?: string | null
          event_id: string
          event_name?: string | null
          event_url?: string | null
          external_url?: boolean | null
          has_detailed_info?: boolean | null
          has_images?: boolean | null
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          is_package?: boolean | null
          local_event_date?: string | null
          main_attraction_id?: string | null
          main_attraction_name?: string | null
          main_attraction_rank?: number | null
          main_attraction_url?: string | null
          off_sale_date?: string | null
          on_sale_date?: string | null
          promoter_address_line_1?: string | null
          promoter_city?: string | null
          promoter_code?: string | null
          promoter_country?: string | null
          promoter_id?: number | null
          promoter_name?: string | null
          promoter_postal_code?: string | null
          promoter_state?: string | null
          rescheduled?: boolean | null
          schedule_status?: string | null
          seatmap_interactive_detailed?: boolean | null
          seatmap_interactive_overview?: boolean | null
          seatmap_static?: boolean | null
          seats_available?: boolean | null
          sold_out?: boolean | null
          subcategory_id?: string | null
          subcategory_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_id?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_postal_code?: string | null
          venue_url?: string | null
        }
        Update: {
          cancelled?: boolean | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          currency?: string | null
          day_of_week?: string | null
          details_fetched_at?: string | null
          event_date?: string | null
          event_id?: string
          event_name?: string | null
          event_url?: string | null
          external_url?: boolean | null
          has_detailed_info?: boolean | null
          has_images?: boolean | null
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          is_package?: boolean | null
          local_event_date?: string | null
          main_attraction_id?: string | null
          main_attraction_name?: string | null
          main_attraction_rank?: number | null
          main_attraction_url?: string | null
          off_sale_date?: string | null
          on_sale_date?: string | null
          promoter_address_line_1?: string | null
          promoter_city?: string | null
          promoter_code?: string | null
          promoter_country?: string | null
          promoter_id?: number | null
          promoter_name?: string | null
          promoter_postal_code?: string | null
          promoter_state?: string | null
          rescheduled?: boolean | null
          schedule_status?: string | null
          seatmap_interactive_detailed?: boolean | null
          seatmap_interactive_overview?: boolean | null
          seatmap_static?: boolean | null
          seats_available?: boolean | null
          sold_out?: boolean | null
          subcategory_id?: string | null
          subcategory_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_id?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_postal_code?: string | null
          venue_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "attractions_with_events_complete"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_details_web"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hotels_available"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_list_page_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events_with_hotel_prices"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "ticketmaster_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "v_event_price_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "v_events_with_details"
            referencedColumns: ["event_id"]
          },
        ]
      }
      ticketmaster_event_details_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          consecutive_errors: number | null
          current_offset: number | null
          domain: string
          failed_events: number | null
          last_rate_limit_available: number | null
          last_run_at: string | null
          processed_events: number | null
          started_at: string | null
          successful_events: number | null
          total_events: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_offset?: number | null
          domain: string
          failed_events?: number | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_events?: number | null
          started_at?: string | null
          successful_events?: number | null
          total_events?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_offset?: number | null
          domain?: string
          failed_events?: number | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_events?: number | null
          started_at?: string | null
          successful_events?: number | null
          total_events?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_details_progress_domain"
            columns: ["domain"]
            isOneToOne: true
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketmaster_event_prices: {
        Row: {
          availability: string | null
          created_at: string | null
          currency: string | null
          display_order: number | null
          event_id: string
          face_value: number
          id: number
          is_best_value: boolean | null
          is_regular_price: boolean | null
          is_vip: boolean | null
          price_level_id: string
          price_level_name: string | null
          price_type_code: string | null
          price_type_description: string | null
          price_type_id: string
          price_type_name: string | null
          ticket_fees: number | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          currency?: string | null
          display_order?: number | null
          event_id: string
          face_value: number
          id?: number
          is_best_value?: boolean | null
          is_regular_price?: boolean | null
          is_vip?: boolean | null
          price_level_id: string
          price_level_name?: string | null
          price_type_code?: string | null
          price_type_description?: string | null
          price_type_id: string
          price_type_name?: string | null
          ticket_fees?: number | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          currency?: string | null
          display_order?: number | null
          event_id?: string
          face_value?: number
          id?: number
          is_best_value?: boolean | null
          is_regular_price?: boolean | null
          is_vip?: boolean | null
          price_level_id?: string
          price_level_name?: string | null
          price_type_code?: string | null
          price_type_description?: string | null
          price_type_id?: string
          price_type_name?: string | null
          ticket_fees?: number | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "attractions_with_events_complete"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_details_web"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_hotels_available"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_list_page_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_hotel_prices"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticketmaster_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_event_price_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_events_with_details"
            referencedColumns: ["event_id"]
          },
        ]
      }
      ticketmaster_events: {
        Row: {
          attractions_count: number | null
          cancelled: boolean | null
          category_id: string | null
          category_name: string | null
          city_for_hotels: string | null
          country_code_for_hotels: string | null
          created_at: string | null
          currency: string | null
          day_of_week: string | null
          domain: string
          event_date: string | null
          event_date_for_hotels: string | null
          event_id: string
          external_url: boolean | null
          has_images: boolean | null
          hotel_search_radius: number | null
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_height: number | null
          image_standard_url: string | null
          image_standard_width: number | null
          is_package: boolean | null
          last_updated_from_api: string | null
          local_event_date: string | null
          main_attraction_id: string | null
          main_attraction_name: string | null
          main_attraction_url: string | null
          max_price: number | null
          min_price: number | null
          minimum_age_required: number | null
          name: string
          off_sale_date: string | null
          on_sale_date: string | null
          prices_last_updated: string | null
          prices_processed: boolean | null
          rescheduled: boolean | null
          schedule_status: string | null
          seats_available: boolean | null
          sold_out: boolean | null
          subcategory_id: string | null
          subcategory_name: string | null
          suggested_checkin_date: string | null
          suggested_checkout_date: string | null
          timezone: string | null
          updated_at: string | null
          url: string | null
          venue_address: string | null
          venue_city: string | null
          venue_coordinates_valid: boolean | null
          venue_country: string | null
          venue_id: number | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
          venue_url: string | null
        }
        Insert: {
          attractions_count?: number | null
          cancelled?: boolean | null
          category_id?: string | null
          category_name?: string | null
          city_for_hotels?: string | null
          country_code_for_hotels?: string | null
          created_at?: string | null
          currency?: string | null
          day_of_week?: string | null
          domain: string
          event_date?: string | null
          event_date_for_hotels?: string | null
          event_id: string
          external_url?: boolean | null
          has_images?: boolean | null
          hotel_search_radius?: number | null
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          is_package?: boolean | null
          last_updated_from_api?: string | null
          local_event_date?: string | null
          main_attraction_id?: string | null
          main_attraction_name?: string | null
          main_attraction_url?: string | null
          max_price?: number | null
          min_price?: number | null
          minimum_age_required?: number | null
          name: string
          off_sale_date?: string | null
          on_sale_date?: string | null
          prices_last_updated?: string | null
          prices_processed?: boolean | null
          rescheduled?: boolean | null
          schedule_status?: string | null
          seats_available?: boolean | null
          sold_out?: boolean | null
          subcategory_id?: string | null
          subcategory_name?: string | null
          suggested_checkin_date?: string | null
          suggested_checkout_date?: string | null
          timezone?: string | null
          updated_at?: string | null
          url?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_coordinates_valid?: boolean | null
          venue_country?: string | null
          venue_id?: number | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_postal_code?: string | null
          venue_url?: string | null
        }
        Update: {
          attractions_count?: number | null
          cancelled?: boolean | null
          category_id?: string | null
          category_name?: string | null
          city_for_hotels?: string | null
          country_code_for_hotels?: string | null
          created_at?: string | null
          currency?: string | null
          day_of_week?: string | null
          domain?: string
          event_date?: string | null
          event_date_for_hotels?: string | null
          event_id?: string
          external_url?: boolean | null
          has_images?: boolean | null
          hotel_search_radius?: number | null
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          is_package?: boolean | null
          last_updated_from_api?: string | null
          local_event_date?: string | null
          main_attraction_id?: string | null
          main_attraction_name?: string | null
          main_attraction_url?: string | null
          max_price?: number | null
          min_price?: number | null
          minimum_age_required?: number | null
          name?: string
          off_sale_date?: string | null
          on_sale_date?: string | null
          prices_last_updated?: string | null
          prices_processed?: boolean | null
          rescheduled?: boolean | null
          schedule_status?: string | null
          seats_available?: boolean | null
          sold_out?: boolean | null
          subcategory_id?: string | null
          subcategory_name?: string | null
          suggested_checkin_date?: string | null
          suggested_checkout_date?: string | null
          timezone?: string | null
          updated_at?: string | null
          url?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_coordinates_valid?: boolean | null
          venue_country?: string | null
          venue_id?: number | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_postal_code?: string | null
          venue_url?: string | null
        }
        Relationships: []
      }
      ticketmaster_events_scan_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          consecutive_errors: number | null
          current_start: number | null
          domain: string
          failed_events: number | null
          has_more: boolean | null
          last_rate_limit_available: number | null
          last_run_at: string | null
          processed_events: number | null
          started_at: string | null
          successful_events: number | null
          total_events: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_start?: number | null
          domain: string
          failed_events?: number | null
          has_more?: boolean | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_events?: number | null
          started_at?: string | null
          successful_events?: number | null
          total_events?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_start?: number | null
          domain?: string
          failed_events?: number | null
          has_more?: boolean | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_events?: number | null
          started_at?: string | null
          successful_events?: number | null
          total_events?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticketmaster_prices_scan_progress: {
        Row: {
          category_id: string
          completed: boolean | null
          completed_at: string | null
          currencies_found: string[] | null
          current_batch: number | null
          domain: string
          error_count: number | null
          events_failed: number | null
          events_processed: number | null
          events_successful: number | null
          id: number
          last_error: string | null
          last_processed_event_id: string | null
          last_rate_limit_available: number | null
          last_run_at: string | null
          max_price_found: number | null
          min_price_found: number | null
          rate_limit_issues_count: number | null
          started_at: string | null
          total_events_to_process: number | null
          total_price_records: number | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          completed?: boolean | null
          completed_at?: string | null
          currencies_found?: string[] | null
          current_batch?: number | null
          domain: string
          error_count?: number | null
          events_failed?: number | null
          events_processed?: number | null
          events_successful?: number | null
          id?: number
          last_error?: string | null
          last_processed_event_id?: string | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          max_price_found?: number | null
          min_price_found?: number | null
          rate_limit_issues_count?: number | null
          started_at?: string | null
          total_events_to_process?: number | null
          total_price_records?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          completed?: boolean | null
          completed_at?: string | null
          currencies_found?: string[] | null
          current_batch?: number | null
          domain?: string
          error_count?: number | null
          events_failed?: number | null
          events_processed?: number | null
          events_successful?: number | null
          id?: number
          last_error?: string | null
          last_processed_event_id?: string | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          max_price_found?: number | null
          min_price_found?: number | null
          rate_limit_issues_count?: number | null
          started_at?: string | null
          total_events_to_process?: number | null
          total_price_records?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticketmaster_venue_details: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          capacity: number | null
          city: string | null
          city_for_hotels: string | null
          code: string | null
          coordinates_valid: boolean | null
          country: string | null
          country_code_for_hotels: string | null
          created_at: string | null
          description: string | null
          details_processed: boolean | null
          domain: string
          full_address: string | null
          hotel_search_radius: number | null
          last_updated_from_api: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          postal_code: string | null
          region: string | null
          timezone: string | null
          updated_at: string | null
          url: string | null
          venue_id: string
          venue_type: string | null
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          capacity?: number | null
          city?: string | null
          city_for_hotels?: string | null
          code?: string | null
          coordinates_valid?: boolean | null
          country?: string | null
          country_code_for_hotels?: string | null
          created_at?: string | null
          description?: string | null
          details_processed?: boolean | null
          domain: string
          full_address?: string | null
          hotel_search_radius?: number | null
          last_updated_from_api?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          timezone?: string | null
          updated_at?: string | null
          url?: string | null
          venue_id: string
          venue_type?: string | null
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          capacity?: number | null
          city?: string | null
          city_for_hotels?: string | null
          code?: string | null
          coordinates_valid?: boolean | null
          country?: string | null
          country_code_for_hotels?: string | null
          created_at?: string | null
          description?: string | null
          details_processed?: boolean | null
          domain?: string
          full_address?: string | null
          hotel_search_radius?: number | null
          last_updated_from_api?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          timezone?: string | null
          updated_at?: string | null
          url?: string | null
          venue_id?: string
          venue_type?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_venue_details_domain"
            columns: ["domain"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketmaster_venue_details_scan_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          consecutive_errors: number | null
          current_position: number | null
          domain: string
          failed_venues: number | null
          has_more: boolean | null
          last_rate_limit_available: number | null
          last_run_at: string | null
          processed_venues: number | null
          started_at: string | null
          successful_venues: number | null
          total_venues: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_position?: number | null
          domain: string
          failed_venues?: number | null
          has_more?: boolean | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_venues?: number | null
          started_at?: string | null
          successful_venues?: number | null
          total_venues?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          consecutive_errors?: number | null
          current_position?: number | null
          domain?: string
          failed_venues?: number | null
          has_more?: boolean | null
          last_rate_limit_available?: number | null
          last_run_at?: string | null
          processed_venues?: number | null
          started_at?: string | null
          successful_venues?: number | null
          total_venues?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_venue_scan_progress_domain"
            columns: ["domain"]
            isOneToOne: true
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          city_id: number | null
          city_name: string | null
          code: string | null
          country: string | null
          created_at: string | null
          domain_id: string
          id: number
          latitude: number | null
          longitude: number | null
          name: string
          postal_code: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          address?: string | null
          city_id?: number | null
          city_name?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          domain_id: string
          id: number
          latitude?: number | null
          longitude?: number | null
          name: string
          postal_code?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          address?: string | null
          city_id?: number | null
          city_name?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          domain_id?: string
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string
          postal_code?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_with_hotel_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      attractions_with_events_complete: {
        Row: {
          attraction_category: string | null
          attraction_id: string | null
          attraction_image: string | null
          attraction_name: string | null
          attraction_url: string | null
          city_for_hotels: string | null
          country_code_for_hotels: string | null
          currency: string | null
          event_cancelled: boolean | null
          event_count: number | null
          event_date: string | null
          event_date_for_hotels: string | null
          event_has_images: boolean | null
          event_id: string | null
          event_image_large: string | null
          event_image_standard: string | null
          event_name: string | null
          event_sold_out: boolean | null
          event_url: string | null
          is_package: boolean | null
          is_upcoming_event: boolean | null
          local_event_date: string | null
          main_attraction_rank: number | null
          max_price: number | null
          min_price: number | null
          prices_processed: boolean | null
          promoter_name: string | null
          record_type: string | null
          rescheduled: boolean | null
          schedule_status: string | null
          seats_available: boolean | null
          suggested_checkin_date: string | null
          suggested_checkout_date: string | null
          upcoming_events: number | null
          venue_address: string | null
          venue_city: string | null
          venue_coordinates_valid: boolean | null
          venue_country: string | null
          venue_id: number | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
        }
        Relationships: []
      }
      cities_with_hotel_stats: {
        Row: {
          avg_hotel_rating: number | null
          country_id: number | null
          created_at: string | null
          domain_id: string | null
          hotel_count: number | null
          id: number | null
          luxury_hotel_count: number | null
          max_hotel_rating: number | null
          name: string | null
          region_id: number | null
          region_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cities_country"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      event_details_page_view: {
        Row: {
          attraction_category_id: string | null
          attraction_category_name: string | null
          attraction_created_at: string | null
          attraction_description: string | null
          attraction_detailed_url: string | null
          attraction_details_processed: boolean | null
          attraction_event_count: number | null
          attraction_full_name: string | null
          attraction_has_images: boolean | null
          attraction_image_large_height: number | null
          attraction_image_large_url: string | null
          attraction_image_large_width: number | null
          attraction_image_standard_height: number | null
          attraction_image_standard_url: string | null
          attraction_image_standard_width: number | null
          attraction_image_vga_height: number | null
          attraction_image_vga_url: string | null
          attraction_image_vga_width: number | null
          attraction_last_updated: string | null
          attraction_subcategory_id: string | null
          attraction_subcategory_name: string | null
          attraction_updated_at: string | null
          available_hotels: Json | null
          available_hotels_count: number | null
          avg_hotel_price: number | null
          avg_price: number | null
          cancelled: boolean | null
          closest_hotel_distance: number | null
          currency: string | null
          day_of_week: string | null
          details_fetched_at: string | null
          event_category_id: string | null
          event_category_name: string | null
          event_created_at: string | null
          event_date: string | null
          event_has_images: boolean | null
          event_id: string | null
          event_image_large_height: number | null
          event_image_large_url: string | null
          event_image_large_width: number | null
          event_image_standard_height: number | null
          event_image_standard_url: string | null
          event_image_standard_width: number | null
          event_name: string | null
          event_subcategory_id: string | null
          event_subcategory_name: string | null
          event_updated_at: string | null
          event_url: string | null
          external_url: boolean | null
          has_best_value_prices: boolean | null
          has_detailed_info: boolean | null
          has_regular_prices: boolean | null
          has_vip_prices: boolean | null
          hotel_currency: string | null
          local_event_date: string | null
          main_attraction_id: string | null
          main_attraction_name: string | null
          main_attraction_url: string | null
          max_hotel_price: number | null
          max_price: number | null
          min_hotel_price: number | null
          min_price: number | null
          off_sale_date: string | null
          on_sale_date: string | null
          price_count: number | null
          promoter_address_line_1: string | null
          promoter_city: string | null
          promoter_code: string | null
          promoter_country: string | null
          promoter_id: number | null
          promoter_name: string | null
          promoter_postal_code: string | null
          promoter_state: string | null
          rescheduled: boolean | null
          schedule_status: string | null
          seats_available: boolean | null
          "Slug artista event details page": string | null
          "Slug city event details page": string | null
          "Slug city genre details page": string | null
          "Slug event details page": string | null
          "Slug event event details page": string | null
          sold_out: boolean | null
          ticket_currency: string | null
          total_hotels_count: number | null
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_id: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
          venue_url: string | null
          vip_availability: string | null
          vip_face_value: number | null
          vip_fees: number | null
          vip_price_level: string | null
          vip_price_type: string | null
          vip_total_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "attractions_with_events_complete"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_details_web"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_hotels_available"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_list_page_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events_with_hotel_prices"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "ticketmaster_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "v_event_price_summary"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_details_event"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "v_events_with_details"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_details_web: {
        Row: {
          available_hotels_count: number | null
          avg_hotel_rating: number | null
          best_value_price: number | null
          cancelled: boolean | null
          category_id: string | null
          category_name: string | null
          city_for_hotels: string | null
          country_code_for_hotels: string | null
          currency: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          event_url: string | null
          external_url: boolean | null
          has_vip_tickets: boolean | null
          hotel_search_radius: number | null
          hotels_within_5km: number | null
          main_attraction_id: string | null
          main_attraction_name: string | null
          max_hotel_price: number | null
          max_ticket_price: number | null
          min_hotel_price: number | null
          min_ticket_price: number | null
          price_levels_count: number | null
          seats_available: boolean | null
          sold_out: boolean | null
          subcategory_id: string | null
          subcategory_name: string | null
          suggested_checkin_date: string | null
          suggested_checkout_date: string | null
          timezone: string | null
          venue_city: string | null
          venue_country: string | null
          venue_id: number | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          vip_min_price: number | null
        }
        Relationships: []
      }
      event_hotels_available: {
        Row: {
          address: string | null
          adults: number | null
          available: boolean | null
          checkin_date: string | null
          checkout_date: string | null
          city_for_hotels: string | null
          currency: string | null
          distance_category: string | null
          distance_to_venue: number | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          hotel_category: string | null
          hotel_description: string | null
          hotel_id: string | null
          hotel_name: string | null
          hotel_price: number | null
          last_checked_at: string | null
          latitude: number | null
          longitude: number | null
          main_photo: string | null
          nights_stay: number | null
          price_per_night: number | null
          rating: number | null
          review_count: number | null
          stars: number | null
          suggested_checkin_date: string | null
          suggested_checkout_date: string | null
          suggested_selling_price: number | null
          thumbnail: string | null
          venue_city: string | null
          venue_name: string | null
        }
        Relationships: []
      }
      event_list_page_view: {
        Row: {
          attraction_description: string | null
          attraction_has_images: boolean | null
          attraction_image_large_url: string | null
          attraction_image_standard_url: string | null
          attraction_total_events: number | null
          attractions_count: number | null
          available_hotels_count: number | null
          avg_hotel_price: number | null
          avg_price: number | null
          best_value_price: number | null
          cancelled: boolean | null
          category_id: string | null
          category_name: string | null
          city_for_hotels: string | null
          closest_hotel_distance: number | null
          country_code_for_hotels: string | null
          created_at: string | null
          currency: string | null
          day_of_week: string | null
          detailed_max_price: number | null
          detailed_min_price: number | null
          display_latitude: number | null
          display_longitude: number | null
          display_price: number | null
          domain: string | null
          event_date: string | null
          event_date_for_hotels: string | null
          event_id: string | null
          event_name: string | null
          event_timing: string | null
          event_url: string | null
          external_url: boolean | null
          has_available_tickets: boolean | null
          has_best_value_tickets: boolean | null
          has_images: boolean | null
          has_vip_tickets: boolean | null
          hotel_search_radius: number | null
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_height: number | null
          image_standard_url: string | null
          image_standard_width: number | null
          last_updated_from_api: string | null
          local_event_date: string | null
          lowest_available_price: number | null
          lowest_vip_price: number | null
          main_attraction_id: string | null
          main_attraction_name: string | null
          main_attraction_url: string | null
          max_price: number | null
          min_hotel_price: number | null
          min_price: number | null
          minimum_age_required: number | null
          off_sale_date: string | null
          on_sale_date: string | null
          price_count: number | null
          prices_last_updated: string | null
          prices_processed: boolean | null
          rescheduled: boolean | null
          sale_status: string | null
          schedule_status: string | null
          seats_available: boolean | null
          sold_out: boolean | null
          subcategory_id: string | null
          subcategory_name: string | null
          suggested_checkin_date: string | null
          suggested_checkout_date: string | null
          updated_at: string | null
          venue_address: string | null
          venue_city: string | null
          venue_coordinates_valid: boolean | null
          venue_country: string | null
          venue_id: number | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
        }
        Relationships: []
      }
      events_with_hotel_prices: {
        Row: {
          available_hotels: number | null
          avg_price: number | null
          city_for_hotels: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          last_price_check: string | null
          max_price: number | null
          min_price: number | null
          suggested_checkin_date: string | null
          suggested_checkout_date: string | null
          total_price_records: number | null
          venue_city: string | null
        }
        Relationships: []
      }
      hotels_with_event_availability: {
        Row: {
          available_dates: number | null
          avg_available_price: number | null
          city: string | null
          hotel_id: string | null
          hotel_name: string | null
          last_checked: string | null
          min_available_price: number | null
          price_records: number | null
          rating: number | null
          stars: number | null
        }
        Relationships: []
      }
      hotels_with_event_stats: {
        Row: {
          accessibility_attributes: Json | null
          address: string | null
          chain: string | null
          chain_id: number | null
          city: string | null
          city_id: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          distance_to_city_center: number | null
          facility_ids: number[] | null
          hotel_description: string | null
          hotel_important_information: string | null
          hotel_type: string | null
          hotel_type_id: number | null
          id: string | null
          last_event_date: string | null
          last_sync_at: string | null
          latitude: number | null
          longitude: number | null
          main_photo: string | null
          name: string | null
          nearby_events_count: number | null
          next_event_date: string | null
          rating: number | null
          review_count: number | null
          stars: number | null
          suitable_for_events: boolean | null
          thumbnail: string | null
          updated_at: string | null
          zip: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_with_hotel_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      v_attractions_summary: {
        Row: {
          attractions_with_events: number | null
          attractions_with_images: number | null
          avg_event_count: number | null
          domain: string | null
          last_update: string | null
          max_event_count: number | null
          total_attractions: number | null
          unique_categories: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attractions_domain"
            columns: ["domain"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      v_event_price_summary: {
        Row: {
          avg_face_value: number | null
          avg_total_price: number | null
          currency: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          event_updated_at: string | null
          high_availability_count: number | null
          low_availability_count: number | null
          max_face_value: number | null
          max_total_price: number | null
          min_face_value: number | null
          min_total_price: number | null
          price_types_count: number | null
          prices_updated_at: string | null
          sold_out_count: number | null
          total_price_options: number | null
          venue_city: string | null
        }
        Relationships: []
      }
      v_events_with_details: {
        Row: {
          attractions_count: number | null
          cancelled: boolean | null
          category_id: string | null
          category_name: string | null
          city_for_hotels: string | null
          country_code_for_hotels: string | null
          created_at: string | null
          currency: string | null
          day_of_week: string | null
          details_fetched_at: string | null
          domain: string | null
          event_date: string | null
          event_date_for_hotels: string | null
          event_id: string | null
          external_url: boolean | null
          has_detailed_info: boolean | null
          has_images: boolean | null
          hotel_search_radius: number | null
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_height: number | null
          image_standard_url: string | null
          image_standard_width: number | null
          is_package: boolean | null
          last_updated_from_api: string | null
          local_event_date: string | null
          main_attraction_id: string | null
          main_attraction_name: string | null
          main_attraction_rank: number | null
          main_attraction_url: string | null
          max_price: number | null
          min_price: number | null
          minimum_age_required: number | null
          name: string | null
          off_sale_date: string | null
          on_sale_date: string | null
          prices_processed: boolean | null
          promoter_city: string | null
          promoter_code: string | null
          promoter_country: string | null
          promoter_id: number | null
          promoter_name: string | null
          rescheduled: boolean | null
          schedule_status: string | null
          seatmap_interactive_detailed: boolean | null
          seatmap_interactive_overview: boolean | null
          seatmap_static: boolean | null
          seats_available: boolean | null
          sold_out: boolean | null
          subcategory_id: string | null
          subcategory_name: string | null
          suggested_checkin_date: string | null
          suggested_checkout_date: string | null
          timezone: string | null
          updated_at: string | null
          url: string | null
          venue_address: string | null
          venue_city: string | null
          venue_coordinates_valid: boolean | null
          venue_country: string | null
          venue_id: number | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
          venue_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      cleanup_old_hotel_prices: { Args: { days_old?: number }; Returns: number }
      cleanup_old_prices: { Args: { days_old?: number }; Returns: number }
      create_attraction_event_relations: { Args: never; Returns: number }
      get_attraction_details_stats: {
        Args: { p_domain?: string }
        Returns: Json
      }
      get_attractions_by_category: {
        Args: { p_category_id?: string; p_domain?: string; p_limit?: number }
        Returns: {
          attraction_id: string
          category_name: string
          event_count: number
          image_large_url: string
          name: string
          subcategory_name: string
        }[]
      }
      get_attractions_needing_details: {
        Args: { p_domain?: string; p_limit?: number }
        Returns: {
          attraction_id: string
          attraction_name: string
          domain: string
          event_count: number
        }[]
      }
      get_attractions_stats: { Args: { p_domain?: string }; Returns: Json }
      get_attractions_with_details: {
        Args: {
          p_category_id?: string
          p_domain?: string
          p_has_events?: boolean
          p_limit?: number
        }
        Returns: {
          attraction_id: string
          category_name: string
          description: string
          event_count: number
          genre: string
          has_images: boolean
          image_large_url: string
          name: string
          subcategory_name: string
        }[]
      }
      get_cities_by_region: {
        Args: { region_name: string }
        Returns: {
          city_id: string
          city_name: string
          country_id: number
        }[]
      }
      get_complete_attractions_events: {
        Args: { domain_filter?: string }
        Returns: {
          attraction_category: string
          attraction_description: string
          attraction_id: string
          attraction_name: string
          attraction_subcategory: string
          attraction_url: string
          cancelled: boolean
          domain: string
          event_category: string
          event_count: number
          event_date: string
          event_id: string
          event_name: string
          genre: string
          sold_out: boolean
          subgenre: string
          venue_city: string
          venue_name: string
        }[]
      }
      get_event_details_stats: { Args: { p_domain?: string }; Returns: Json }
      get_event_hotels: {
        Args: { p_event_id: string; p_limit?: number }
        Returns: {
          address: string
          checkin_date: string
          checkout_date: string
          distance_category: string
          distance_to_venue: number
          hotel_category: string
          hotel_description: string
          hotel_id: string
          hotel_name: string
          hotel_price: number
          main_photo: string
          nights_stay: number
          price_per_night: number
          rating: number
          review_count: number
          stars: number
        }[]
      }
      get_facility_descriptions: {
        Args: { facility_ids_array: number[] }
        Returns: string[]
      }
      get_hotel_prices_for_event: {
        Args: {
          event_id_param: string
          limit_results?: number
          max_price?: number
        }
        Returns: {
          available: boolean
          distance_to_venue: number
          hotel_id: string
          hotel_name: string
          hotel_rating: number
          hotel_stars: number
          last_checked: string
          price: number
          suggested_selling_price: number
        }[]
      }
      get_hotels_near_events: {
        Args: {
          event_city?: string
          limit_results?: number
          max_distance_km?: number
          min_rating?: number
        }
        Returns: {
          distance_km: number
          event_count: number
          hotel_city: string
          hotel_id: string
          hotel_name: string
          hotel_rating: number
          hotel_stars: number
          main_photo: string
        }[]
      }
      get_recent_attractions: {
        Args: { p_domain?: string; p_limit?: number }
        Returns: {
          attraction_id: string
          category_name: string
          event_count: number
          has_images: boolean
          last_updated_from_api: string
          name: string
          subcategory_name: string
        }[]
      }
      get_related_events: {
        Args: { p_event_id: string; p_limit?: number }
        Returns: {
          event_date: string
          event_id: string
          event_name: string
          min_ticket_price: number
          slug: string
          venue_city: string
          venue_name: string
        }[]
      }
      get_venue_details_stats: { Args: { p_domain?: string }; Returns: Json }
      get_venues_needing_details: {
        Args: { p_domain?: string; p_limit?: number }
        Returns: {
          domain: string
          venue_id: string
          venue_name: string
        }[]
      }
      populate_attraction_page_details: { Args: never; Returns: string }
      populate_cities_debug: {
        Args: never
        Returns: {
          count_result: number
          message: string
          step: string
        }[]
      }
      populate_cities_simple: { Args: never; Returns: number }
      populate_city_events_flat: { Args: never; Returns: number }
      populate_event_hotels_table: { Args: never; Returns: undefined }
      populate_event_page_details: { Args: never; Returns: string }
      refresh_attractions_events_complete: {
        Args: { domain_filter?: string }
        Returns: string
      }
      refresh_events_hotels_view: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_all_events_available_hotels: { Args: never; Returns: number }
      update_best_value_tickets: { Args: never; Returns: undefined }
      update_city_events: {
        Args: { city_name_param: string }
        Returns: boolean
      }
      update_event_available_hotels: {
        Args: { p_event_id: string }
        Returns: Json
      }
      update_vip_status: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
