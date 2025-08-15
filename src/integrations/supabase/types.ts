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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      market_reports: {
        Row: {
          active_listings: number | null
          avg_price_per_sqft: number | null
          closed_sales: number | null
          county: string | null
          created_at: string
          days_on_market: number | null
          id: string
          location_type: string
          median_sale_price: number | null
          mom_change: Json | null
          months_of_inventory: number | null
          neighborhood: string | null
          neighborhood_slug: string | null
          new_listings: number | null
          report_date: string
          retrieved_at: string | null
          sources: Json | null
          state: string | null
          updated_at: string
          user_id: string
          yoy_change: Json | null
        }
        Insert: {
          active_listings?: number | null
          avg_price_per_sqft?: number | null
          closed_sales?: number | null
          county?: string | null
          created_at?: string
          days_on_market?: number | null
          id?: string
          location_type: string
          median_sale_price?: number | null
          mom_change?: Json | null
          months_of_inventory?: number | null
          neighborhood?: string | null
          neighborhood_slug?: string | null
          new_listings?: number | null
          report_date: string
          retrieved_at?: string | null
          sources?: Json | null
          state?: string | null
          updated_at?: string
          user_id: string
          yoy_change?: Json | null
        }
        Update: {
          active_listings?: number | null
          avg_price_per_sqft?: number | null
          closed_sales?: number | null
          county?: string | null
          created_at?: string
          days_on_market?: number | null
          id?: string
          location_type?: string
          median_sale_price?: number | null
          mom_change?: Json | null
          months_of_inventory?: number | null
          neighborhood?: string | null
          neighborhood_slug?: string | null
          new_listings?: number | null
          report_date?: string
          retrieved_at?: string | null
          sources?: Json | null
          state?: string | null
          updated_at?: string
          user_id?: string
          yoy_change?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brokerage_logo_url: string | null
          county: string | null
          created_at: string
          email: string | null
          google_api_key: string | null
          headshot_url: string | null
          logo_url: string | null
          name: string | null
          neighborhood: string | null
          neighborhood_slug: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brokerage_logo_url?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          google_api_key?: string | null
          headshot_url?: string | null
          logo_url?: string | null
          name?: string | null
          neighborhood?: string | null
          neighborhood_slug?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brokerage_logo_url?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          google_api_key?: string | null
          headshot_url?: string | null
          logo_url?: string | null
          name?: string | null
          neighborhood?: string | null
          neighborhood_slug?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          listing_agent: string | null
          price: number | null
          property_type: string | null
          square_feet: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          listing_agent?: string | null
          price?: number | null
          property_type?: string | null
          square_feet?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          listing_agent?: string | null
          price?: number | null
          property_type?: string | null
          square_feet?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          property_id: string
          room_type: string | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          property_id: string
          room_type?: string | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          property_id?: string
          room_type?: string | null
          sort_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
