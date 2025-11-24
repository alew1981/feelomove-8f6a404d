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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      lite_tbl_cities: {
        Row: {
          city: string
          country_code: string
          created_at: string
          id: number
          updated_at: string
        }
        Insert: {
          city: string
          country_code: string
          created_at?: string
          id?: number
          updated_at?: string
        }
        Update: {
          city?: string
          country_code?: string
          created_at?: string
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cities_country"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "lite_tbl_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      lite_tbl_city_mapping: {
        Row: {
          created_at: string | null
          event_city: string
          event_country: string
          hotel_city: string
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          event_city: string
          event_country: string
          hotel_city: string
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          event_city?: string
          event_country?: string
          hotel_city?: string
          notes?: string | null
        }
        Relationships: []
      }
      lite_tbl_countries: {
        Row: {
          code: string
          created_at: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lite_tbl_hotels: {
        Row: {
          accessibility_attributes: Json | null
          address: string | null
          chain: string | null
          chain_id: number | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          facility_ids: number[] | null
          facility_names_en: string[] | null
          facility_names_es: string[] | null
          hotel_description: string | null
          hotel_type_id: number | null
          hotel_type_name: string | null
          id: string
          latitude: number | null
          longitude: number | null
          main_photo: string | null
          name: string
          primary_hotel_id: string | null
          rating: number | null
          review_count: number | null
          stars: number | null
          thumbnail: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          accessibility_attributes?: Json | null
          address?: string | null
          chain?: string | null
          chain_id?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          facility_ids?: number[] | null
          facility_names_en?: string[] | null
          facility_names_es?: string[] | null
          hotel_description?: string | null
          hotel_type_id?: number | null
          hotel_type_name?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          name: string
          primary_hotel_id?: string | null
          rating?: number | null
          review_count?: number | null
          stars?: number | null
          thumbnail?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          accessibility_attributes?: Json | null
          address?: string | null
          chain?: string | null
          chain_id?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          facility_ids?: number[] | null
          facility_names_en?: string[] | null
          facility_names_es?: string[] | null
          hotel_description?: string | null
          hotel_type_id?: number | null
          hotel_type_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          name?: string
          primary_hotel_id?: string | null
          rating?: number | null
          review_count?: number | null
          stars?: number | null
          thumbnail?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      lovable_tbl_packages: {
        Row: {
          adults: number | null
          checkin_date: string
          checkout_date: string
          created_at: string | null
          currency: string | null
          deeplink: string | null
          domain_id: string
          event_id: string
          event_ticket_prices: Json | null
          hotel_id: string
          id: number
          nights: number
          price: number | null
          suggested_selling_price: number | null
          updated_at: string | null
        }
        Insert: {
          adults?: number | null
          checkin_date: string
          checkout_date: string
          created_at?: string | null
          currency?: string | null
          deeplink?: string | null
          domain_id: string
          event_id: string
          event_ticket_prices?: Json | null
          hotel_id: string
          id?: number
          nights?: number
          price?: number | null
          suggested_selling_price?: number | null
          updated_at?: string | null
        }
        Update: {
          adults?: number | null
          checkin_date?: string
          checkout_date?: string
          created_at?: string | null
          currency?: string | null
          deeplink?: string | null
          domain_id?: string
          event_id?: string
          event_ticket_prices?: Json | null
          hotel_id?: string
          id?: number
          nights?: number
          price?: number | null
          suggested_selling_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_packages_event"
            columns: ["event_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "lovable_view_packages"
            referencedColumns: ["event_id", "domain_id"]
          },
          {
            foreignKeyName: "fk_packages_event"
            columns: ["event_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_events"
            referencedColumns: ["event_id", "domain_id"]
          },
          {
            foreignKeyName: "fk_packages_hotel"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "lite_tbl_hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      sys_tbl_processing_logs: {
        Row: {
          api_response: Json | null
          batch_id: string
          created_at: string | null
          domain_id: string | null
          error_details: Json | null
          event_id: string | null
          id: number
          message: string
          processing_time_ms: number | null
          status: string
        }
        Insert: {
          api_response?: Json | null
          batch_id: string
          created_at?: string | null
          domain_id?: string | null
          error_details?: Json | null
          event_id?: string | null
          id?: number
          message: string
          processing_time_ms?: number | null
          status: string
        }
        Update: {
          api_response?: Json | null
          batch_id?: string
          created_at?: string | null
          domain_id?: string | null
          error_details?: Json | null
          event_id?: string | null
          id?: number
          message?: string
          processing_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      sys_tbl_sync_control: {
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
      tm_tbl_attractions: {
        Row: {
          attraction_id: string
          category_id: number | null
          category_name: string | null
          created_at: string | null
          description: string | null
          domain_id: string
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
          name: string
          subcategory_id: number | null
          subcategory_name: string | null
          subgenre: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          attraction_id: string
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          description?: string | null
          domain_id: string
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
          name: string
          subcategory_id?: number | null
          subcategory_name?: string | null
          subgenre?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          attraction_id?: string
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          description?: string | null
          domain_id?: string
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
          name?: string
          subcategory_id?: number | null
          subcategory_name?: string | null
          subgenre?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attractions_category"
            columns: ["category_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_categories"
            referencedColumns: ["id", "domain_id"]
          },
          {
            foreignKeyName: "fk_attractions_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attractions_subcategory"
            columns: ["subcategory_id", "category_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_subcategories"
            referencedColumns: ["id", "category_id", "domain_id"]
          },
        ]
      }
      tm_tbl_categories: {
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
            foreignKeyName: "fk_categories_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      tm_tbl_domains: {
        Row: {
          country_id: string | null
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
          country_id?: string | null
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
          country_id?: string | null
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
      tm_tbl_event_prices: {
        Row: {
          availability: string | null
          created_at: string | null
          currency: string | null
          domain_id: string
          event_id: string
          face_value: number | null
          id: number
          is_regular_price: boolean | null
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
          domain_id: string
          event_id: string
          face_value?: number | null
          id?: number
          is_regular_price?: boolean | null
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
          domain_id?: string
          event_id?: string
          face_value?: number | null
          id?: number
          is_regular_price?: boolean | null
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
            foreignKeyName: "fk_event_prices_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "lovable_view_packages"
            referencedColumns: ["event_id", "domain_id"]
          },
          {
            foreignKeyName: "fk_event_prices_event"
            columns: ["event_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_events"
            referencedColumns: ["event_id", "domain_id"]
          },
        ]
      }
      tm_tbl_events: {
        Row: {
          attractions_count: number | null
          cancelled: boolean | null
          category_id: number | null
          category_name: string | null
          created_at: string | null
          currency: string | null
          day_of_week: string | null
          domain_id: string
          event_date: string | null
          event_id: string
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
          main_attraction_url: string | null
          max_price: number | null
          min_price: number | null
          minimum_age_required: number | null
          name: string
          off_sale_date: string | null
          on_sale_date: string | null
          prices_processed: boolean | null
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
          subcategory_id: number | null
          subcategory_name: string | null
          timezone: string | null
          updated_at: string | null
          url: string | null
          venue_address: string | null
          venue_city: string | null
          venue_coordinates_valid: boolean | null
          venue_country: string | null
          venue_id: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
          venue_url: string | null
        }
        Insert: {
          attractions_count?: number | null
          cancelled?: boolean | null
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          currency?: string | null
          day_of_week?: string | null
          domain_id: string
          event_date?: string | null
          event_id: string
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
          main_attraction_url?: string | null
          max_price?: number | null
          min_price?: number | null
          minimum_age_required?: number | null
          name: string
          off_sale_date?: string | null
          on_sale_date?: string | null
          prices_processed?: boolean | null
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
          subcategory_id?: number | null
          subcategory_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          url?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_coordinates_valid?: boolean | null
          venue_country?: string | null
          venue_id?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_postal_code?: string | null
          venue_url?: string | null
        }
        Update: {
          attractions_count?: number | null
          cancelled?: boolean | null
          category_id?: number | null
          category_name?: string | null
          created_at?: string | null
          currency?: string | null
          day_of_week?: string | null
          domain_id?: string
          event_date?: string | null
          event_id?: string
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
          main_attraction_url?: string | null
          max_price?: number | null
          min_price?: number | null
          minimum_age_required?: number | null
          name?: string
          off_sale_date?: string | null
          on_sale_date?: string | null
          prices_processed?: boolean | null
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
          subcategory_id?: number | null
          subcategory_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          url?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_coordinates_valid?: boolean | null
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
            foreignKeyName: "fk_events_attraction"
            columns: ["main_attraction_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_attractions"
            referencedColumns: ["attraction_id", "domain_id"]
          },
          {
            foreignKeyName: "fk_events_category"
            columns: ["category_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_categories"
            referencedColumns: ["id", "domain_id"]
          },
          {
            foreignKeyName: "fk_events_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_subcategory"
            columns: ["subcategory_id", "category_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_subcategories"
            referencedColumns: ["id", "category_id", "domain_id"]
          },
          {
            foreignKeyName: "fk_events_venue"
            columns: ["venue_id", "domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_venues"
            referencedColumns: ["id", "domain_id"]
          },
        ]
      }
      tm_tbl_subcategories: {
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
            referencedRelation: "tm_tbl_categories"
            referencedColumns: ["id", "domain_id"]
          },
        ]
      }
      tm_tbl_venues: {
        Row: {
          address: string | null
          city_id: string | null
          city_name: string | null
          code: string | null
          country: string | null
          created_at: string | null
          domain_id: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          place_id: string | null
          postal_code: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          city_name?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          domain_id: string
          id: string
          latitude?: number | null
          longitude?: number | null
          name: string
          place_id?: string | null
          postal_code?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          city_name?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          domain_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          place_id?: string | null
          postal_code?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_venues_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_domains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      lovable_view_packages: {
        Row: {
          category_name: string | null
          domain_id: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          hotel_summary: Json | null
          image_standard_url: string | null
          main_attraction_name: string | null
          ticket_prices: Json | null
          venue_city: string | null
          venue_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_events_domain"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      v_monitoring_quick_stats: {
        Row: {
          actualizados_hoy: number | null
          eventos_con_precios: number | null
          opciones_noches_diferentes: number | null
          precio_medio_global: number | null
          registros_con_deeplink: number | null
          total_registros: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_hotel_prices: { Args: never; Returns: number }
      cleanup_old_price_logs: { Args: never; Returns: number }
      get_best_hotels_for_event: {
        Args: { p_event_id: string; p_limit?: number }
        Returns: {
          city: string
          hotel_id: string
          hotel_name: string
          price: number
          rating: number
          stars: number
        }[]
      }
      get_event_hotel_stats_by_city: {
        Args: never
        Returns: {
          ciudad: string
          eventos_con_hoteles: number
          eventos_sin_hoteles: number
          hoteles_disponibles_promedio: number
          pais: string
          porcentaje_con_hoteles: number
          total_eventos: number
        }[]
      }
      get_event_price_range: {
        Args: { p_domain_id: string; p_event_id: string }
        Returns: {
          avg_price: number
          currency: string
          max_price: number
          min_price: number
          price_count: number
        }[]
      }
      get_events_with_hotels_in_city: {
        Args: { p_city_name: string; p_limit?: number }
        Returns: {
          event_id: string
          hotels_count: number
          max_price: number
          min_price: number
        }[]
      }
      get_events_without_hotel_prices: {
        Args: { limit_count: number }
        Returns: {
          domain_id: string
          event_date: string
          event_id: string
          name: string
          venue_city: string
          venue_country: string
        }[]
      }
      get_hotel_city_and_country_for_event: {
        Args: { p_event_city: string; p_event_country: string }
        Returns: Record<string, unknown>
      }
      get_hotel_city_for_event: {
        Args: { p_event_city: string; p_event_country: string }
        Returns: string
      }
      get_hotel_sync_summary: {
        Args: never
        Returns: {
          metrica: string
          porcentaje: number
          valor: number
        }[]
      }
      lovable_fn_refresh_view: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
