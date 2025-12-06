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
      ai_models: {
        Row: {
          avg_generation_time_seconds: number | null
          best_for: string | null
          created_at: string
          credits_cost: number
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          model_id: string
          name: string
          provider: string
          slug: string
        }
        Insert: {
          avg_generation_time_seconds?: number | null
          best_for?: string | null
          created_at?: string
          credits_cost: number
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          model_id: string
          name: string
          provider: string
          slug: string
        }
        Update: {
          avg_generation_time_seconds?: number | null
          best_for?: string | null
          created_at?: string
          credits_cost?: number
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          model_id?: string
          name?: string
          provider?: string
          slug?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          cached_tokens: number | null
          created_at: string
          creative_id: string | null
          duration_ms: number | null
          error_message: string | null
          estimated_cost_usd: number | null
          id: string
          image_count: number | null
          input_tokens: number | null
          metadata: Json | null
          model: string
          organization_id: string | null
          output_tokens: number | null
          prompt_length: number | null
          provider: string
          request_type: string
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          cached_tokens?: number | null
          created_at?: string
          creative_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          image_count?: number | null
          input_tokens?: number | null
          metadata?: Json | null
          model: string
          organization_id?: string | null
          output_tokens?: number | null
          prompt_length?: number | null
          provider: string
          request_type: string
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          cached_tokens?: number | null
          created_at?: string
          creative_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          image_count?: number | null
          input_tokens?: number | null
          metadata?: Json | null
          model?: string
          organization_id?: string | null
          output_tokens?: number | null
          prompt_length?: number | null
          provider?: string
          request_type?: string
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      creatives: {
        Row: {
          ai_model: string
          ai_model_id: string | null
          created_at: string
          created_by: string | null
          creative_type: string
          credits_used: number
          download_count: number | null
          expires_at: string | null
          form_data: Json
          generation_time_ms: number | null
          id: string
          image_url: string
          is_favorite: boolean | null
          logo_config: Json | null
          organization_id: string
          prompt_used: string | null
          thumbnail_url: string | null
          title: string | null
          vertical: string | null
        }
        Insert: {
          ai_model: string
          ai_model_id?: string | null
          created_at?: string
          created_by?: string | null
          creative_type: string
          credits_used: number
          download_count?: number | null
          expires_at?: string | null
          form_data: Json
          generation_time_ms?: number | null
          id?: string
          image_url: string
          is_favorite?: boolean | null
          logo_config?: Json | null
          organization_id: string
          prompt_used?: string | null
          thumbnail_url?: string | null
          title?: string | null
          vertical?: string | null
        }
        Update: {
          ai_model?: string
          ai_model_id?: string | null
          created_at?: string
          created_by?: string | null
          creative_type?: string
          credits_used?: number
          download_count?: number | null
          expires_at?: string | null
          form_data?: Json
          generation_time_ms?: number | null
          id?: string
          image_url?: string
          is_favorite?: boolean | null
          logo_config?: Json | null
          organization_id?: string
          prompt_used?: string | null
          thumbnail_url?: string | null
          title?: string | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creatives_ai_model_id_fkey"
            columns: ["ai_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          amount_inr: number | null
          balance_after: number
          created_at: string
          creative_id: string | null
          description: string | null
          id: string
          metadata: Json | null
          organization_id: string
          payment_id: string | null
          payment_provider: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          amount_inr?: number | null
          balance_after: number
          created_at?: string
          creative_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          payment_id?: string | null
          payment_provider?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          amount_inr?: number | null
          balance_after?: number
          created_at?: string
          creative_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          payment_id?: string | null
          payment_provider?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_logos: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          default_position: string | null
          file_size_bytes: number | null
          file_url: string
          has_transparency: boolean | null
          height: number | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          thumbnail_url: string | null
          width: number | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          default_position?: string | null
          file_size_bytes?: number | null
          file_url: string
          has_transparency?: boolean | null
          height?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          thumbnail_url?: string | null
          width?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          default_position?: string | null
          file_size_bytes?: number | null
          file_url?: string
          has_transparency?: boolean | null
          height?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          thumbnail_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_logos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_config: Json | null
          created_at: string
          credits_balance: number
          id: string
          invite_code: string | null
          is_active: boolean | null
          name: string
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          brand_config?: Json | null
          created_at?: string
          credits_balance?: number
          id?: string
          invite_code?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          type?: string
          updated_at?: string
        }
        Update: {
          brand_config?: Json | null
          created_at?: string
          credits_balance?: number
          id?: string
          invite_code?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_images: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_size: number | null
          height: number | null
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          organization_id: string
          style_tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          use_count: number | null
          vertical_id: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          organization_id: string
          style_tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          use_count?: number | null
          vertical_id?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          style_tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          use_count?: number | null
          vertical_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "template_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_images_vertical_id_fkey"
            columns: ["vertical_id"]
            isOneToOne: false
            referencedRelation: "vertical_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          form_data: Json
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          logo_config: Json | null
          name: string
          organization_id: string | null
          preview_image_url: string | null
          source_creative_id: string | null
          updated_at: string | null
          use_count: number | null
          vertical: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          form_data?: Json
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          logo_config?: Json | null
          name: string
          organization_id?: string | null
          preview_image_url?: string | null
          source_creative_id?: string | null
          updated_at?: string | null
          use_count?: number | null
          vertical?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          form_data?: Json
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          logo_config?: Json | null
          name?: string
          organization_id?: string | null
          preview_image_url?: string | null
          source_creative_id?: string | null
          updated_at?: string | null
          use_count?: number | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_source_creative_id_fkey"
            columns: ["source_creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      vertical_presets: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          form_fields: Json
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          prompt_template: string
          slug: string
          theme_config: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          form_fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          prompt_template: string
          slug: string
          theme_config?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          form_fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          prompt_template?: string
          slug?: string
          theme_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_amount_inr: number
          p_description?: string
          p_organization_id: string
          p_payment_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      can_edit_org: { Args: { org_id: string }; Returns: boolean }
      check_org_has_no_members: { Args: { p_org_id: string }; Returns: boolean }
      check_user_is_org_admin: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: boolean
      }
      check_user_is_org_member: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: boolean
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_creative_id?: string
          p_description?: string
          p_organization_id: string
        }
        Returns: {
          error_message: string
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      get_user_org_role: { Args: { org_id: string }; Returns: string }
      increment_template_use_count: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      refund_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_organization_id: string
          p_original_transaction_id?: string
        }
        Returns: {
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      user_belongs_to_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
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

// Convenience type aliases for common tables
export type Creative = Tables<'creatives'>
export type Template = Tables<'templates'>
export type VerticalPreset = Tables<'vertical_presets'>
export type AIModel = Tables<'ai_models'>
export type Organization = Tables<'organizations'>
export type OrganizationMember = Tables<'organization_members'>
export type OrganizationLogo = Tables<'organization_logos'>
export type CreditTransaction = Tables<'credit_transactions'>
export type UserProfile = Tables<'user_profiles'>
export type TemplateImage = Tables<'template_images'>
export type ApiUsage = Tables<'api_usage'>

// Custom types for JSON columns
export interface BrandConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontPrimary: string
  fontSecondary: string
  headerZoneHeight: number
  footerZoneHeight: number
  footerText: string
  footerEmail: string
  footerWebsite: string
}
