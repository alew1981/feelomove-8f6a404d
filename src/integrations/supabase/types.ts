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
      lite_tbl_hotels: {
        Row: {
          accessibility_attributes: Json | null
          address: string | null
          chain: string | null
          chain_id: number | null
          city: string
          country: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          facilities_catalog: Json | null
          facilities_fetched_at: string | null
          facility_ids: number[] | null
          hotel_description: string | null
          hotel_important_information: string | null
          hotel_type: string | null
          hotel_type_id: number | null
          id: string
          latitude: number | null
          longitude: number | null
          main_photo: string | null
          name: string
          place_id: string | null
          primary_hotel_id: string | null
          rating: number | null
          raw_hotel_data: Json | null
          review_count: number | null
          review_last_date: string | null
          review_score_avg: number | null
          review_total_count: number | null
          reviews_fetched_at: string | null
          reviews_raw: Json | null
          stars: number | null
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
          country?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          facilities_catalog?: Json | null
          facilities_fetched_at?: string | null
          facility_ids?: number[] | null
          hotel_description?: string | null
          hotel_important_information?: string | null
          hotel_type?: string | null
          hotel_type_id?: number | null
          id: string
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          name: string
          place_id?: string | null
          primary_hotel_id?: string | null
          rating?: number | null
          raw_hotel_data?: Json | null
          review_count?: number | null
          review_last_date?: string | null
          review_score_avg?: number | null
          review_total_count?: number | null
          reviews_fetched_at?: string | null
          reviews_raw?: Json | null
          stars?: number | null
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
          country?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          facilities_catalog?: Json | null
          facilities_fetched_at?: string | null
          facility_ids?: number[] | null
          hotel_description?: string | null
          hotel_important_information?: string | null
          hotel_type?: string | null
          hotel_type_id?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          main_photo?: string | null
          name?: string
          place_id?: string | null
          primary_hotel_id?: string | null
          rating?: number | null
          raw_hotel_data?: Json | null
          review_count?: number | null
          review_last_date?: string | null
          review_score_avg?: number | null
          review_total_count?: number | null
          reviews_fetched_at?: string | null
          reviews_raw?: Json | null
          stars?: number | null
          thumbnail?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      lovable_tbl_cities_processed: {
        Row: {
          city: string
          hotels_found: number | null
          notes: string | null
          processed_at: string | null
        }
        Insert: {
          city: string
          hotels_found?: number | null
          notes?: string | null
          processed_at?: string | null
        }
        Update: {
          city?: string
          hotels_found?: number | null
          notes?: string | null
          processed_at?: string | null
        }
        Relationships: []
      }
      tbl_event_hotel_prices: {
        Row: {
          adults: number | null
          api_response: Json | null
          checkin_date: string
          checkout_date: string
          created_at: string | null
          currency: string | null
          event_date: string
          event_id: string
          event_name: string | null
          guest_nationality: string | null
          hotel_id: string
          hotel_name: string | null
          id: string
          price: number
          price_fetched_at: string | null
          suggested_selling_price: number | null
          updated_at: string | null
          venue_city: string | null
        }
        Insert: {
          adults?: number | null
          api_response?: Json | null
          checkin_date: string
          checkout_date: string
          created_at?: string | null
          currency?: string | null
          event_date: string
          event_id: string
          event_name?: string | null
          guest_nationality?: string | null
          hotel_id: string
          hotel_name?: string | null
          id?: string
          price: number
          price_fetched_at?: string | null
          suggested_selling_price?: number | null
          updated_at?: string | null
          venue_city?: string | null
        }
        Update: {
          adults?: number | null
          api_response?: Json | null
          checkin_date?: string
          checkout_date?: string
          created_at?: string | null
          currency?: string | null
          event_date?: string
          event_id?: string
          event_name?: string | null
          guest_nationality?: string | null
          hotel_id?: string
          hotel_name?: string | null
          id?: string
          price?: number
          price_fetched_at?: string | null
          suggested_selling_price?: number | null
          updated_at?: string | null
          venue_city?: string | null
        }
        Relationships: []
      }
      tm_tbl_events: {
        Row: {
          attraction_ids: string[] | null
          attraction_names: string[] | null
          attractions: Json | null
          attractions_enriched: Json | null
          cancelled: boolean | null
          categories: Json | null
          created_at: string
          currency: string | null
          day_of_week: string | null
          domain: string | null
          event_date: string | null
          external_url: boolean | null
          id: string
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_height: number | null
          image_standard_url: string | null
          image_standard_width: number | null
          is_package: boolean | null
          local_event_date: string | null
          name: string
          off_sale_date: string | null
          on_sale_date: string | null
          price_max_excl_fees: number | null
          price_max_incl_fees: number | null
          price_min_excl_fees: number | null
          price_min_incl_fees: number | null
          prices: Json | null
          promoter_address: Json | null
          promoter_code: string | null
          promoter_id: number | null
          promoter_name: string | null
          raw_event_data: Json | null
          raw_prices_data: Json | null
          rescheduled: boolean | null
          schedule_status: string | null
          seatmap_interactive_detailed: boolean | null
          seatmap_interactive_overview: boolean | null
          seatmap_static: boolean | null
          seats_available: boolean | null
          slug: string
          sold_out: boolean | null
          timezone: string | null
          updated_at: string
          url: string | null
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
          attraction_ids?: string[] | null
          attraction_names?: string[] | null
          attractions?: Json | null
          attractions_enriched?: Json | null
          cancelled?: boolean | null
          categories?: Json | null
          created_at?: string
          currency?: string | null
          day_of_week?: string | null
          domain?: string | null
          event_date?: string | null
          external_url?: boolean | null
          id: string
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          is_package?: boolean | null
          local_event_date?: string | null
          name: string
          off_sale_date?: string | null
          on_sale_date?: string | null
          price_max_excl_fees?: number | null
          price_max_incl_fees?: number | null
          price_min_excl_fees?: number | null
          price_min_incl_fees?: number | null
          prices?: Json | null
          promoter_address?: Json | null
          promoter_code?: string | null
          promoter_id?: number | null
          promoter_name?: string | null
          raw_event_data?: Json | null
          raw_prices_data?: Json | null
          rescheduled?: boolean | null
          schedule_status?: string | null
          seatmap_interactive_detailed?: boolean | null
          seatmap_interactive_overview?: boolean | null
          seatmap_static?: boolean | null
          seats_available?: boolean | null
          slug: string
          sold_out?: boolean | null
          timezone?: string | null
          updated_at?: string
          url?: string | null
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
          attraction_ids?: string[] | null
          attraction_names?: string[] | null
          attractions?: Json | null
          attractions_enriched?: Json | null
          cancelled?: boolean | null
          categories?: Json | null
          created_at?: string
          currency?: string | null
          day_of_week?: string | null
          domain?: string | null
          event_date?: string | null
          external_url?: boolean | null
          id?: string
          image_large_height?: number | null
          image_large_url?: string | null
          image_large_width?: number | null
          image_standard_height?: number | null
          image_standard_url?: string | null
          image_standard_width?: number | null
          is_package?: boolean | null
          local_event_date?: string | null
          name?: string
          off_sale_date?: string | null
          on_sale_date?: string | null
          price_max_excl_fees?: number | null
          price_max_incl_fees?: number | null
          price_min_excl_fees?: number | null
          price_min_incl_fees?: number | null
          prices?: Json | null
          promoter_address?: Json | null
          promoter_code?: string | null
          promoter_id?: number | null
          promoter_name?: string | null
          raw_event_data?: Json | null
          raw_prices_data?: Json | null
          rescheduled?: boolean | null
          schedule_status?: string | null
          seatmap_interactive_detailed?: boolean | null
          seatmap_interactive_overview?: boolean | null
          seatmap_static?: boolean | null
          seats_available?: boolean | null
          slug?: string
          sold_out?: boolean | null
          timezone?: string | null
          updated_at?: string
          url?: string | null
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
        Relationships: []
      }
    }
    Views: {
      vw_events_with_hotels: {
        Row: {
          attraction_ids: string[] | null
          attraction_names: string[] | null
          attraction_slug: string | null
          attractions: Json | null
          avg_hotel_price: number | null
          cancelled: boolean | null
          categories: Json | null
          day_of_week: string | null
          estimated_package_savings: number | null
          event_badges: string[] | null
          event_created_at: string | null
          event_currency: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          event_slug: string | null
          event_updated_at: string | null
          event_url: string | null
          has_hotel_offers: boolean | null
          hotels: Json | null
          hotels_count: number | null
          hotels_last_updated: string | null
          image_large_height: number | null
          image_large_url: string | null
          image_large_width: number | null
          image_standard_url: string | null
          local_event_date: string | null
          max_hotel_price: number | null
          min_hotel_price: number | null
          off_sale_date: string | null
          on_sale_date: string | null
          package_price_max: number | null
          package_price_min: number | null
          promoter_address: Json | null
          promoter_code: string | null
          promoter_name: string | null
          rescheduled: boolean | null
          schedule_status: string | null
          seats_available: boolean | null
          sold_out: boolean | null
          ticket_cheapest_price: number | null
          ticket_price_max: number | null
          ticket_price_max_no_fees: number | null
          ticket_price_min: number | null
          ticket_price_min_no_fees: number | null
          ticket_prices_detail: Json | null
          timezone: string | null
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
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_hotel_prices: { Args: never; Returns: number }
      cleanup_old_price_logs: { Args: never; Returns: number }
      generate_slug: {
        Args: { event_id: string; text_input: string }
        Returns: string
      }
      generate_slug_with_city_date: {
        Args: {
          city_input: string
          event_date_input: string
          text_input: string
        }
        Returns: string
      }
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
      get_cities_needing_hotels: {
        Args: { batch_size: number }
        Returns: {
          city: string
          event_count: number
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
      unaccent_string: { Args: { "": string }; Returns: string }
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
