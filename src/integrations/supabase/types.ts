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
      campaign_performance: {
        Row: {
          campaign_id: string | null
          campaign_name: string
          campaign_type: string
          clicks: number | null
          conversions: number | null
          cost: number | null
          created_at: string
          date_range_end: string
          date_range_start: string
          id: string
          impressions: number | null
          revenue: number | null
          roi: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          campaign_name: string
          campaign_type: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          created_at?: string
          date_range_end: string
          date_range_start: string
          id?: string
          impressions?: number | null
          revenue?: number | null
          roi?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          campaign_name?: string
          campaign_type?: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          id?: string
          impressions?: number | null
          revenue?: number | null
          roi?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_analytics: {
        Row: {
          content_id: string | null
          content_type: string
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          referrer: string | null
          user_agent: string | null
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          content_id?: string | null
          content_type: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          referrer?: string | null
          user_agent?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      content_history: {
        Row: {
          content: string
          content_type: string
          county: string | null
          created_at: string
          id: string
          neighborhood: string | null
          report_date: string | null
          state: string | null
          template_used: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_type: string
          county?: string | null
          created_at?: string
          id?: string
          neighborhood?: string | null
          report_date?: string | null
          state?: string | null
          template_used?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          county?: string | null
          created_at?: string
          id?: string
          neighborhood?: string | null
          report_date?: string | null
          state?: string | null
          template_used?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_performance: {
        Row: {
          bounce_rate: number | null
          content_history_id: string | null
          conversion_rate: number | null
          created_at: string
          date_recorded: string
          downloads: number | null
          id: string
          leads_generated: number | null
          page_views: number | null
          revenue_attributed: number | null
          shares: number | null
          time_on_page: number | null
          unique_visitors: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounce_rate?: number | null
          content_history_id?: string | null
          conversion_rate?: number | null
          created_at?: string
          date_recorded?: string
          downloads?: number | null
          id?: string
          leads_generated?: number | null
          page_views?: number | null
          revenue_attributed?: number | null
          shares?: number | null
          time_on_page?: number | null
          unique_visitors?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounce_rate?: number | null
          content_history_id?: string | null
          conversion_rate?: number | null
          created_at?: string
          date_recorded?: string
          downloads?: number | null
          id?: string
          leads_generated?: number | null
          page_views?: number | null
          revenue_attributed?: number | null
          shares?: number | null
          time_on_page?: number | null
          unique_visitors?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_content_history_id_fkey"
            columns: ["content_history_id"]
            isOneToOne: false
            referencedRelation: "content_history"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          content_type: string
          created_at: string
          id: string
          is_public: boolean
          name: string
          template_content: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
          template_content: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          template_content?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversion_tracking: {
        Row: {
          attribution_data: Json | null
          attribution_source: string | null
          conversion_date: string
          conversion_type: string
          conversion_value: number | null
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attribution_data?: Json | null
          attribution_source?: string | null
          conversion_date?: string
          conversion_type: string
          conversion_value?: number | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attribution_data?: Json | null
          attribution_source?: string | null
          conversion_date?: string
          conversion_type?: string
          conversion_value?: number | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_tracking_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          bounce_rate: number | null
          campaign_name: string
          campaign_settings: Json | null
          click_rate: number | null
          content_id: string | null
          created_at: string
          id: string
          open_rate: number | null
          preview_text: string | null
          recipients_count: number
          scheduled_at: string | null
          sender_email: string | null
          sender_name: string | null
          sent_at: string | null
          status: string
          subject_line: string
          unsubscribe_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounce_rate?: number | null
          campaign_name: string
          campaign_settings?: Json | null
          click_rate?: number | null
          content_id?: string | null
          created_at?: string
          id?: string
          open_rate?: number | null
          preview_text?: string | null
          recipients_count?: number
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          status?: string
          subject_line: string
          unsubscribe_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounce_rate?: number | null
          campaign_name?: string
          campaign_settings?: Json | null
          click_rate?: number | null
          content_id?: string | null
          created_at?: string
          id?: string
          open_rate?: number | null
          preview_text?: string | null
          recipients_count?: number
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          status?: string
          subject_line?: string
          unsubscribe_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_recipients: {
        Row: {
          bounce_reason: string | null
          campaign_id: string
          clicked_at: string | null
          created_at: string
          delivery_status: string
          id: string
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounce_reason?: string | null
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          delivery_status?: string
          id?: string
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounce_reason?: string | null
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          delivery_status?: string
          id?: string
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_images: {
        Row: {
          category: string | null
          created_at: string
          dimensions: Json | null
          enhanced_url: string | null
          enhancement_preset: string | null
          enhancement_settings: Json | null
          file_size: number | null
          id: string
          original_filename: string
          original_url: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          dimensions?: Json | null
          enhanced_url?: string | null
          enhancement_preset?: string | null
          enhancement_settings?: Json | null
          file_size?: number | null
          id?: string
          original_filename: string
          original_url: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          dimensions?: Json | null
          enhanced_url?: string | null
          enhancement_preset?: string | null
          enhancement_settings?: Json | null
          file_size?: number | null
          id?: string
          original_filename?: string
          original_url?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_capture_forms: {
        Row: {
          created_at: string
          embed_code: string
          form_config: Json
          form_name: string
          form_type: string
          id: string
          is_active: boolean
          landing_page_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          embed_code: string
          form_config?: Json
          form_name: string
          form_type: string
          id?: string
          is_active?: boolean
          landing_page_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          embed_code?: string
          form_config?: Json
          form_name?: string
          form_type?: string
          id?: string
          is_active?: boolean
          landing_page_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_generation_tracking: {
        Row: {
          content_id: string | null
          created_at: string
          follow_up_date: string | null
          id: string
          lead_data: Json
          lead_medium: string | null
          lead_source: string
          lead_value: number | null
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          lead_data?: Json
          lead_medium?: string | null
          lead_source: string
          lead_value?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          lead_data?: Json
          lead_medium?: string | null
          lead_source?: string
          lead_value?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_submissions: {
        Row: {
          created_at: string
          form_id: string
          id: string
          lead_data: Json
          lead_score: number | null
          notes: string | null
          source_url: string | null
          status: string
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          lead_data?: Json
          lead_score?: number | null
          notes?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          lead_data?: Json
          lead_score?: number | null
          notes?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "lead_capture_forms"
            referencedColumns: ["id"]
          },
        ]
      }
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
      newsletter_drafts: {
        Row: {
          branding_preferences: Json | null
          content: string
          created_at: string
          id: string
          status: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branding_preferences?: Json | null
          content: string
          created_at?: string
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branding_preferences?: Json | null
          content?: string
          created_at?: string
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          property_interests: string[] | null
          subscription_preferences: Json | null
          subscription_source: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          property_interests?: string[] | null
          subscription_preferences?: Json | null
          subscription_source?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          property_interests?: string[] | null
          subscription_preferences?: Json | null
          subscription_source?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
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
          onboarding_completed: boolean
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
          onboarding_completed?: boolean
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
          onboarding_completed?: boolean
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_analytics: {
        Row: {
          id: string
          metrics: Json
          platform: string
          recorded_at: string
          social_media_post_id: string
          user_id: string
        }
        Insert: {
          id?: string
          metrics?: Json
          platform: string
          recorded_at?: string
          social_media_post_id: string
          user_id: string
        }
        Update: {
          id?: string
          metrics?: Json
          platform?: string
          recorded_at?: string
          social_media_post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_analytics_social_media_post_id_fkey"
            columns: ["social_media_post_id"]
            isOneToOne: false
            referencedRelation: "social_media_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_posts: {
        Row: {
          content_history_id: string | null
          created_at: string
          engagement_metrics: Json | null
          id: string
          media_urls: string[] | null
          platform: string
          platform_post_id: string | null
          post_content: string
          posted_at: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_history_id?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          media_urls?: string[] | null
          platform: string
          platform_post_id?: string | null
          post_content: string
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_history_id?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          platform_post_id?: string | null
          post_content?: string
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_templates: {
        Row: {
          created_at: string
          hashtags: string[] | null
          id: string
          is_public: boolean
          name: string
          platform: string
          template_content: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashtags?: string[] | null
          id?: string
          is_public?: boolean
          name: string
          platform: string
          template_content: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashtags?: string[] | null
          id?: string
          is_public?: boolean
          name?: string
          platform?: string
          template_content?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
