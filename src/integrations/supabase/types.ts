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
      backup_urls_largas_20260104: {
        Row: {
          backup_created_at: string | null
          id: string | null
          name: string | null
          slug_original: string | null
        }
        Insert: {
          backup_created_at?: string | null
          id?: string | null
          name?: string | null
          slug_original?: string | null
        }
        Update: {
          backup_created_at?: string | null
          id?: string | null
          name?: string | null
          slug_original?: string | null
        }
        Relationships: []
      }
      canonical_event_urls: {
        Row: {
          canonical_event_id: string
          canonical_slug: string
          created_at: string | null
          duplicate_event_ids: string[] | null
          duplicate_slugs: string[] | null
          event_date: string
          event_name: string
          id: string
          updated_at: string | null
          venue_city: string
        }
        Insert: {
          canonical_event_id: string
          canonical_slug: string
          created_at?: string | null
          duplicate_event_ids?: string[] | null
          duplicate_slugs?: string[] | null
          event_date: string
          event_name: string
          id?: string
          updated_at?: string | null
          venue_city: string
        }
        Update: {
          canonical_event_id?: string
          canonical_slug?: string
          created_at?: string | null
          duplicate_event_ids?: string[] | null
          duplicate_slugs?: string[] | null
          event_date?: string
          event_name?: string
          id?: string
          updated_at?: string | null
          venue_city?: string
        }
        Relationships: []
      }
      lite_tbl_city_mapping: {
        Row: {
          country_code: string | null
          created_at: string | null
          id: number
          imagen_ciudad: string | null
          liteapi_city: string
          notes: string | null
          place_id: string | null
          ticketmaster_city: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          id?: number
          imagen_ciudad?: string | null
          liteapi_city: string
          notes?: string | null
          place_id?: string | null
          ticketmaster_city: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          id?: number
          imagen_ciudad?: string | null
          liteapi_city?: string
          notes?: string | null
          place_id?: string | null
          ticketmaster_city?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      lite_tbl_event_hotel_prices: {
        Row: {
          adults: number | null
          checkin_date: string
          checkout_date: string
          children: number | null
          currency: string | null
          event_id: string
          fetched_at: string | null
          hotel_id: string
          id: number
          is_available: boolean | null
          min_price: number | null
          nights: number
          suggested_selling_price: number | null
          ticketmaster_city: string | null
        }
        Insert: {
          adults?: number | null
          checkin_date: string
          checkout_date: string
          children?: number | null
          currency?: string | null
          event_id: string
          fetched_at?: string | null
          hotel_id: string
          id?: number
          is_available?: boolean | null
          min_price?: number | null
          nights: number
          suggested_selling_price?: number | null
          ticketmaster_city?: string | null
        }
        Update: {
          adults?: number | null
          checkin_date?: string
          checkout_date?: string
          children?: number | null
          currency?: string | null
          event_id?: string
          fetched_at?: string | null
          hotel_id?: string
          id?: number
          is_available?: boolean | null
          min_price?: number | null
          nights?: number
          suggested_selling_price?: number | null
          ticketmaster_city?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lite_tbl_event_hotel_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "lovable_mv_event_product_page_conciertos"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "lite_tbl_event_hotel_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "lovable_mv_event_product_page_festivales"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "lite_tbl_event_hotel_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mv_concerts_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lite_tbl_event_hotel_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mv_events_meta_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lite_tbl_event_hotel_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mv_events_schema_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lite_tbl_event_hotel_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mv_festivals_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lite_tbl_event_hotel_prices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "tm_tbl_events"
            referencedColumns: ["id"]
          },
        ]
      }
      lite_tbl_facilities: {
        Row: {
          created_at: string | null
          facility_id: number
          facility_name_en: string
          facility_name_es: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          facility_id: number
          facility_name_en: string
          facility_name_es: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          facility_id?: number
          facility_name_en?: string
          facility_name_es?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lite_tbl_genres: {
        Row: {
          created_at: string | null
          genre_id: number
          genre_name: string
          image_genres: string | null
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          genre_id: number
          genre_name: string
          image_genres?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          genre_id?: number
          genre_name?: string
          image_genres?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lite_tbl_hotels: {
        Row: {
          active: boolean | null
          address: string | null
          cached_min_price: number | null
          cached_price_date: string | null
          checkin_time: string | null
          checkout_time: string | null
          city: string
          country: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          facility_ids: number[] | null
          facility_names_es: string[] | null
          hotel_description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          main_photo: string | null
          name: string
          rating: number | null
          review_count: number | null
          slug: string | null
          stars: number | null
          thumbnail: string | null
          ticketmaster_city: string
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          cached_min_price?: number | null
          cached_price_date?: string | null
          checkin_time?: string | null
          checkout_time?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          facility_ids?: number[] | null
          facility_names_es?: string[] | null
          hotel_description?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          name: string
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          stars?: number | null
          thumbnail?: string | null
          ticketmaster_city: string
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          cached_min_price?: number | null
          cached_price_date?: string | null
          checkin_time?: string | null
          checkout_time?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          facility_ids?: number[] | null
          facility_names_es?: string[] | null
          hotel_description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          name?: string
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          stars?: number | null
          thumbnail?: string | null
          ticketmaster_city?: string
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      slug_migration_log: {
        Row: {
          event_id: string
          migrated_at: string | null
          new_slug: string | null
          old_slug: string | null
        }
        Insert: {
          event_id: string
          migrated_at?: string | null
          new_slug?: string | null
          old_slug?: string | null
        }
        Update: {
          event_id?: string
          migrated_at?: string | null
          new_slug?: string | null
          old_slug?: string | null
        }
        Relationships: []
      }
      slug_redirects: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          new_slug: string
          old_slug: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          new_slug: string
          old_slug: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          new_slug?: string
          old_slug?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      tm_tbl_events: {
        Row: {
          attraction_ids: string[] | null
          attraction_names: string[] | null
          attraction_urls: string[] | null
          cancelled: boolean | null
          categories_data: Json | null
          created_at: string | null
          currency: string | null
          day_of_week: string | null
          domain: string | null
          door_opening_date: string | null
          event_date: string
          event_date_format: string | null
          event_type: string | null
          exclude_from_sitemap: boolean | null
          external_url: boolean | null
          has_hotel_prices: boolean | null
          has_real_availability: boolean | null
          hotel_prices_fetched_at: string | null
          id: string
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_height: number | null
          image_standard_url: string | null
          image_standard_width: number | null
          is_package: boolean | null
          is_transport: boolean | null
          local_event_date: string | null
          local_event_date_format: string | null
          minimum_age_required: number | null
          name: string
          needs_price_update: boolean | null
          off_sale_date: string | null
          on_sale_date: string | null
          price_max_excl_fees: number | null
          price_max_incl_fees: number | null
          price_min_excl_fees: number | null
          price_min_incl_fees: number | null
          primary_attraction_id: string | null
          primary_attraction_name: string | null
          primary_category_id: number | null
          primary_category_name: string | null
          primary_subcategory_id: number | null
          primary_subcategory_name: string | null
          rescheduled: boolean | null
          schedule_status: string | null
          seatmap_interactive_detailed: boolean | null
          seatmap_interactive_overview: boolean | null
          seatmap_static: boolean | null
          seats_available: boolean | null
          secondary_attraction_id: string | null
          secondary_attraction_name: string | null
          secondary_attraction_url: string | null
          slug: string | null
          sold_out: boolean | null
          ticket_types: Json | null
          timezone: string | null
          updated_at: string | null
          url: string | null
          venue_address: string | null
          venue_city: string
          venue_country: string | null
          venue_id: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
          venue_url: string | null
        }
        Insert: {
          attraction_ids?: string[] | null
          attraction_names?: string[] | null
          attraction_urls?: string[] | null
          cancelled?: boolean | null
          categories_data?: Json | null
          created_at?: string | null
          currency?: string | null
          day_of_week?: string | null
          domain?: string | null
          door_opening_date?: string | null
          event_date: string
          event_date_format?: string | null
          event_type?: string | null
          exclude_from_sitemap?: boolean | null
          external_url?: boolean | null
          has_hotel_prices?: boolean | null
          has_real_availability?: boolean | null
          hotel_prices_fetched_at?: string | null
          id: string
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          is_package?: boolean | null
          is_transport?: boolean | null
          local_event_date?: string | null
          local_event_date_format?: string | null
          minimum_age_required?: number | null
          name: string
          needs_price_update?: boolean | null
          off_sale_date?: string | null
          on_sale_date?: string | null
          price_max_excl_fees?: number | null
          price_max_incl_fees?: number | null
          price_min_excl_fees?: number | null
          price_min_incl_fees?: number | null
          primary_attraction_id?: string | null
          primary_attraction_name?: string | null
          primary_category_id?: number | null
          primary_category_name?: string | null
          primary_subcategory_id?: number | null
          primary_subcategory_name?: string | null
          rescheduled?: boolean | null
          schedule_status?: string | null
          seatmap_interactive_detailed?: boolean | null
          seatmap_interactive_overview?: boolean | null
          seatmap_static?: boolean | null
          seats_available?: boolean | null
          secondary_attraction_id?: string | null
          secondary_attraction_name?: string | null
          secondary_attraction_url?: string | null
          slug?: string | null
          sold_out?: boolean | null
          ticket_types?: Json | null
          timezone?: string | null
          updated_at?: string | null
          url?: string | null
          venue_address?: string | null
          venue_city: string
          venue_country?: string | null
          venue_id?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_postal_code?: string | null
          venue_url?: string | null
        }
        Update: {
          attraction_ids?: string[] | null
          attraction_names?: string[] | null
          attraction_urls?: string[] | null
          cancelled?: boolean | null
          categories_data?: Json | null
          created_at?: string | null
          currency?: string | null
          day_of_week?: string | null
          domain?: string | null
          door_opening_date?: string | null
          event_date?: string
          event_date_format?: string | null
          event_type?: string | null
          exclude_from_sitemap?: boolean | null
          external_url?: boolean | null
          has_hotel_prices?: boolean | null
          has_real_availability?: boolean | null
          hotel_prices_fetched_at?: string | null
          id?: string
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          is_package?: boolean | null
          is_transport?: boolean | null
          local_event_date?: string | null
          local_event_date_format?: string | null
          minimum_age_required?: number | null
          name?: string
          needs_price_update?: boolean | null
          off_sale_date?: string | null
          on_sale_date?: string | null
          price_max_excl_fees?: number | null
          price_max_incl_fees?: number | null
          price_min_excl_fees?: number | null
          price_min_incl_fees?: number | null
          primary_attraction_id?: string | null
          primary_attraction_name?: string | null
          primary_category_id?: number | null
          primary_category_name?: string | null
          primary_subcategory_id?: number | null
          primary_subcategory_name?: string | null
          rescheduled?: boolean | null
          schedule_status?: string | null
          seatmap_interactive_detailed?: boolean | null
          seatmap_interactive_overview?: boolean | null
          seatmap_static?: boolean | null
          seats_available?: boolean | null
          secondary_attraction_id?: string | null
          secondary_attraction_name?: string | null
          secondary_attraction_url?: string | null
          slug?: string | null
          sold_out?: boolean | null
          ticket_types?: Json | null
          timezone?: string | null
          updated_at?: string | null
          url?: string | null
          venue_address?: string | null
          venue_city?: string
          venue_country?: string | null
          venue_id?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
          venue_postal_code?: string | null
          venue_url?: string | null
        }
        Relationships: []
      }
      tm_tbl_festival_details: {
        Row: {
          camping_available: boolean | null
          created_at: string | null
          end_date: string
          end_date_manual: string | null
          festival_event_id: string
          festival_stages: string[] | null
          has_official_transport: boolean | null
          headliners: string[] | null
          last_manual_edit_at: string | null
          lineup_artist_ids: string[] | null
          lineup_artists: string[] | null
          lineup_artists_manual: string[] | null
          manually_edited: boolean | null
          start_date: string
          start_date_manual: string | null
          transport_event_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          camping_available?: boolean | null
          created_at?: string | null
          end_date: string
          end_date_manual?: string | null
          festival_event_id: string
          festival_stages?: string[] | null
          has_official_transport?: boolean | null
          headliners?: string[] | null
          last_manual_edit_at?: string | null
          lineup_artist_ids?: string[] | null
          lineup_artists?: string[] | null
          lineup_artists_manual?: string[] | null
          manually_edited?: boolean | null
          start_date: string
          start_date_manual?: string | null
          transport_event_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          camping_available?: boolean | null
          created_at?: string | null
          end_date?: string
          end_date_manual?: string | null
          festival_event_id?: string
          festival_stages?: string[] | null
          has_official_transport?: boolean | null
          headliners?: string[] | null
          last_manual_edit_at?: string | null
          lineup_artist_ids?: string[] | null
          lineup_artists?: string[] | null
          lineup_artists_manual?: string[] | null
          manually_edited?: boolean | null
          start_date?: string
          start_date_manual?: string | null
          transport_event_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tm_tbl_festival_details_festival_event_id_fkey"
            columns: ["festival_event_id"]
            isOneToOne: true
            referencedRelation: "lovable_mv_event_product_page_conciertos"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tm_tbl_festival_details_festival_event_id_fkey"
            columns: ["festival_event_id"]
            isOneToOne: true
            referencedRelation: "lovable_mv_event_product_page_festivales"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "tm_tbl_festival_details_festival_event_id_fkey"
            columns: ["festival_event_id"]
            isOneToOne: true
            referencedRelation: "mv_concerts_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tm_tbl_festival_details_festival_event_id_fkey"
            columns: ["festival_event_id"]
            isOneToOne: true
            referencedRelation: "mv_events_meta_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tm_tbl_festival_details_festival_event_id_fkey"
            columns: ["festival_event_id"]
            isOneToOne: true
            referencedRelation: "mv_events_schema_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tm_tbl_festival_details_festival_event_id_fkey"
            columns: ["festival_event_id"]
            isOneToOne: true
            referencedRelation: "mv_festivals_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tm_tbl_festival_details_festival_event_id_fkey"
            columns: ["festival_event_id"]
            isOneToOne: true
            referencedRelation: "tm_tbl_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      lovable_mv_event_product_page_conciertos: {
        Row: {
          attraction_ids: string[] | null
          attraction_names: string[] | null
          attraction_urls: string[] | null
          cancelled: boolean | null
          categories_data: Json | null
          day_of_week: string | null
          event_currency: string | null
          event_date: string | null
          event_date_format: string | null
          event_id: string | null
          event_name: string | null
          event_season: string | null
          event_slug: string | null
          event_type: string | null
          event_url: string | null
          has_hotel_prices: boolean | null
          has_real_availability: boolean | null
          has_vip_tickets: boolean | null
          hotel_prices_fetched_at: string | null
          image_large_url: string | null
          image_standard_url: string | null
          is_package: boolean | null
          is_transport: boolean | null
          local_event_date: string | null
          local_event_date_format: string | null
          meta_description: string | null
          minimum_age_required: number | null
          off_sale_date: string | null
          on_sale_date: string | null
          price_min_incl_fees: number | null
          primary_attraction_id: string | null
          primary_attraction_name: string | null
          primary_category_name: string | null
          primary_subcategory_name: string | null
          rescheduled: boolean | null
          schedule_status: string | null
          seatmap_static: boolean | null
          seats_available: boolean | null
          secondary_attraction_name: string | null
          secondary_attraction_url: string | null
          seo_title: string | null
          sold_out: boolean | null
          ticket_price_min: number | null
          ticket_types: Json | null
          timezone: string | null
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
          venue_url: string | null
        }
        Relationships: []
      }
      lovable_mv_event_product_page_festivales: {
        Row: {
          camping_available: boolean | null
          cancelled: boolean | null
          categories_data: Json | null
          end_date: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          event_slug: string | null
          festival_stages: string[] | null
          has_hotel_prices: boolean | null
          has_official_transport: boolean | null
          has_real_availability: boolean | null
          headliners: string[] | null
          hotel_prices_fetched_at: string | null
          image_large_url: string | null
          image_standard_url: string | null
          is_package: boolean | null
          is_transport: boolean | null
          lineup_artist_ids: string[] | null
          lineup_artists: string[] | null
          local_event_date: string | null
          price_min_incl_fees: number | null
          seo_title: string | null
          sold_out: boolean | null
          start_date: string | null
          ticket_types: Json | null
          timezone: string | null
          transport_event_ids: string[] | null
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
          venue_postal_code: string | null
        }
        Relationships: []
      }
      mv_artists_seo_content: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          artist_slug: string | null
          cities_count: number | null
          cities_list: string | null
          h1_content: string | null
          intro_text: string | null
          last_event_date: string | null
          main_genre: string | null
          meta_keywords: string[] | null
          min_price: number | null
          next_event_date: string | null
          og_tags: Json | null
          seo_description: string | null
          seo_title: string | null
          total_upcoming_events: number | null
        }
        Relationships: []
      }
      mv_attractions: {
        Row: {
          attraction_id: string | null
          attraction_name: string | null
          attraction_slug: string | null
          city_count: number | null
          event_count: number | null
          genres: string[] | null
          last_event_date: string | null
          meta_description: string | null
          next_event_date: string | null
          sample_image_standard_url: string | null
          sample_image_url: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          top_cities_json: Json | null
        }
        Relationships: []
      }
      mv_cities_seo_content: {
        Row: {
          artists_count: number | null
          available_genres: string | null
          city_name: string | null
          city_slug: string | null
          genres_count: number | null
          h1_content: string | null
          intro_text: string | null
          last_event_date: string | null
          meta_keywords: string[] | null
          min_price: number | null
          next_event_date: string | null
          og_tags: Json | null
          seo_description: string | null
          seo_title: string | null
          top_artists: string | null
          total_upcoming_events: number | null
        }
        Relationships: []
      }
      mv_concerts_cards: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          badges: string[] | null
          canonical_slug: string | null
          currency: string | null
          day_of_week: string | null
          event_date: string | null
          genre: string | null
          genre_slug: string | null
          has_packages: boolean | null
          hotels_available: number | null
          id: string | null
          image_large_url: string | null
          image_standard_url: string | null
          meta_description: string | null
          min_hotel_distance_km: number | null
          name: string | null
          price_max_incl_fees: number | null
          price_min_incl_fees: number | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string | null
          sold_out: boolean | null
          url: string | null
          venue_city: string | null
          venue_city_slug: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
        }
        Relationships: []
      }
      mv_destinations_cards: {
        Row: {
          avg_hotel_price: number | null
          avg_price: number | null
          city_name: string | null
          city_slug: string | null
          concerts_count: number | null
          event_count: number | null
          festivals_count: number | null
          genres: string[] | null
          has_packages: boolean | null
          hotels_count: number | null
          hotels_max_stars: number | null
          hotels_min_stars: number | null
          last_event_date: string | null
          meta_description: string | null
          next_event_date: string | null
          price_from: number | null
          price_to: number | null
          sample_image_standard_url: string | null
          sample_image_url: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          top_artists: string[] | null
          top_genres_json: Json | null
          top_venues_json: Json | null
        }
        Relationships: []
      }
      mv_events_meta_tags: {
        Row: {
          additional_metadata: Json | null
          canonical_url: string | null
          event_date: string | null
          event_type: string | null
          id: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          name: string | null
          og_description: string | null
          og_image: string | null
          og_locale: string | null
          og_site_name: string | null
          og_title: string | null
          og_type: string | null
          og_url: string | null
          slug: string | null
          twitter_card: string | null
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
        }
        Relationships: []
      }
      mv_events_schema_org: {
        Row: {
          event_type: string | null
          id: string | null
          schema_org_json: Json | null
          slug: string | null
        }
        Relationships: []
      }
      mv_festivals_cards: {
        Row: {
          artist_count: number | null
          attraction_names: string[] | null
          badges: string[] | null
          canonical_slug: string | null
          currency: string | null
          day_of_week: string | null
          event_date: string | null
          festival_duration_days: unknown
          genre: string | null
          genre_slug: string | null
          has_packages: boolean | null
          hotels_available: number | null
          id: string | null
          image_large_url: string | null
          image_standard_url: string | null
          main_attraction: string | null
          main_attraction_id: string | null
          meta_description: string | null
          min_hotel_distance_km: number | null
          name: string | null
          price_max_incl_fees: number | null
          price_min_incl_fees: number | null
          secondary_attraction_name: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string | null
          sold_out: boolean | null
          url: string | null
          venue_city: string | null
          venue_city_slug: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
        }
        Relationships: []
      }
      mv_genres_cards: {
        Row: {
          cities: string[] | null
          event_count: number | null
          first_event_date: string | null
          genre_id: number | null
          genre_name: string | null
          image_genres: string | null
          last_event_date: string | null
        }
        Relationships: []
      }
      mv_genres_seo_content: {
        Row: {
          artists_count: number | null
          cities_count: number | null
          cities_with_events: string | null
          genre_name: string | null
          genre_slug: string | null
          h1_content: string | null
          intro_text: string | null
          meta_keywords: string[] | null
          min_price: number | null
          next_event_date: string | null
          og_tags: Json | null
          seo_description: string | null
          seo_title: string | null
          top_artists: string | null
          total_upcoming_events: number | null
        }
        Relationships: []
      }
      mv_internal_links: {
        Row: {
          related_links: Json | null
          source_id: string | null
          source_slug: string | null
          source_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      calculate_event_badges: {
        Args: {
          p_cancelled: boolean
          p_day_of_week: string
          p_event_date: string
          p_event_type: string
          p_is_package: boolean
          p_minimum_age_required: number
          p_price_max_incl_fees: number
          p_price_min_incl_fees: number
          p_primary_attraction_name: string
          p_primary_subcategory_name: string
          p_rescheduled: boolean
          p_seatmap_interactive_detailed: boolean
          p_seatmap_static: boolean
          p_seats_available: boolean
          p_sold_out: boolean
          p_venue_city: string
        }
        Returns: string[]
      }
      calculate_hotel_nights: {
        Args: { event_date: string }
        Returns: {
          checkin_date: string
          checkout_date: string
          nights: number
        }[]
      }
      calculate_real_availability: {
        Args: { fallback_available: boolean; ticket_data: Json }
        Returns: boolean
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      earth: { Args: never; Returns: number }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_concert_slug: {
        Args: {
          p_artist_name: string
          p_city: string
          p_event_date: string
          p_event_name: string
        }
        Returns: string
      }
      generate_event_schema_org: { Args: { p_event_id: string }; Returns: Json }
      generate_event_slug: {
        Args: {
          p_event_date: string
          p_event_id: string
          p_name: string
          p_venue_city: string
          p_venue_name: string
        }
        Returns: string
      }
      generate_seo_slug: { Args: { text_input: string }; Returns: string }
      generate_seo_slug_with_spanish_date_v2: {
        Args: {
          p_event_date: string
          p_event_hour?: number
          p_is_vip?: boolean
          p_name: string
          p_primary_attraction_name?: string
          p_venue_city: string
        }
        Returns: string
      }
      generate_unique_concert_slug: {
        Args: {
          p_artist_name: string
          p_city: string
          p_event_date: string
          p_event_id: string
          p_event_name: string
        }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_all_site_urls: {
        Args: never
        Returns: {
          last_modified: string
          url: string
          url_type: string
        }[]
      }
      get_cities_with_deeplinks: {
        Args: never
        Returns: {
          id: number
          imagen_ciudad: string
          liteapi_city: string
          nuitee_deeplink: string
          place_id: string
          ticketmaster_city: string
          verified: boolean
        }[]
      }
      get_event_badges: { Args: { event_id: string }; Returns: string[] }
      get_facility_names_es: {
        Args: { facility_id_array: number[] }
        Returns: string[]
      }
      get_homepage_data: {
        Args: { p_cities?: string[]; p_featured_ids?: string[] }
        Returns: Json
      }
      get_nearest_hotels: {
        Args: {
          p_city: string
          p_event_lat: number
          p_event_lng: number
          p_limit: number
        }
        Returns: {
          city: string
          distance_km: number
          id: string
          latitude: number
          longitude: number
          name: string
        }[]
      }
      get_spanish_month_name: { Args: { month_num: number }; Returns: string }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      migrate_concert_slugs: {
        Args: never
        Returns: {
          redirect_count: number
          updated_count: number
        }[]
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      refresh_all_event_mvs: { Args: never; Returns: undefined }
      refresh_all_event_views: { Args: never; Returns: undefined }
      refresh_events_cards: { Args: never; Returns: undefined }
      refresh_hotel_packages_view: { Args: never; Returns: undefined }
      refresh_product_page_view: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { text_input: string }; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      trigger_ticketmaster_sync: { Args: never; Returns: undefined }
      unaccent: { Args: { "": string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      update_affiliate_urls: { Args: never; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
