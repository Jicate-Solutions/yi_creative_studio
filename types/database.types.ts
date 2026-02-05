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
      ab_assignments: {
        Row: {
          adjustments_made: Json | null
          assignment_hash: string | null
          created_at: string | null
          creative_id: string | null
          experiment_id: string | null
          feedback_id: string | null
          feedback_rating: number | null
          feedback_received_at: string | null
          id: string
          organization_id: string | null
          pattern_applied: boolean | null
          user_id: string | null
          variant: string
        }
        Insert: {
          adjustments_made?: Json | null
          assignment_hash?: string | null
          created_at?: string | null
          creative_id?: string | null
          experiment_id?: string | null
          feedback_id?: string | null
          feedback_rating?: number | null
          feedback_received_at?: string | null
          id?: string
          organization_id?: string | null
          pattern_applied?: boolean | null
          user_id?: string | null
          variant: string
        }
        Update: {
          adjustments_made?: Json | null
          assignment_hash?: string | null
          created_at?: string | null
          creative_id?: string | null
          experiment_id?: string | null
          feedback_id?: string | null
          feedback_rating?: number | null
          feedback_received_at?: string | null
          id?: string
          organization_id?: string | null
          pattern_applied?: boolean | null
          user_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_assignments_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_experiments: {
        Row: {
          completed_at: string | null
          confidence_level: number | null
          control_avg_rating: number | null
          control_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_significant: boolean | null
          min_samples: number | null
          name: string
          p_value: number | null
          pattern_id: string | null
          promoted_at: string | null
          results: Json | null
          started_at: string | null
          status: string | null
          traffic_percentage: number | null
          treatment_avg_rating: number | null
          treatment_count: number | null
          updated_at: string | null
          winner: string | null
        }
        Insert: {
          completed_at?: string | null
          confidence_level?: number | null
          control_avg_rating?: number | null
          control_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_significant?: boolean | null
          min_samples?: number | null
          name: string
          p_value?: number | null
          pattern_id?: string | null
          promoted_at?: string | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          traffic_percentage?: number | null
          treatment_avg_rating?: number | null
          treatment_count?: number | null
          updated_at?: string | null
          winner?: string | null
        }
        Update: {
          completed_at?: string | null
          confidence_level?: number | null
          control_avg_rating?: number | null
          control_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_significant?: boolean | null
          min_samples?: number | null
          name?: string
          p_value?: number | null
          pattern_id?: string | null
          promoted_at?: string | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          traffic_percentage?: number | null
          treatment_avg_rating?: number | null
          treatment_count?: number | null
          updated_at?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_experiments_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "seeded_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
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
      color_analysis_cache: {
        Row: {
          analysis_result: Json
          content_zone_bounds: Json | null
          created_at: string | null
          creative_id: string
          detected_zones: Json
          error_message: string | null
          estimated_cost_usd: number | null
          expires_at: string | null
          id: string
          image_url: string
          input_tokens: number | null
          model_used: string | null
          output_tokens: number | null
          status: string | null
        }
        Insert: {
          analysis_result: Json
          content_zone_bounds?: Json | null
          created_at?: string | null
          creative_id: string
          detected_zones: Json
          error_message?: string | null
          estimated_cost_usd?: number | null
          expires_at?: string | null
          id?: string
          image_url: string
          input_tokens?: number | null
          model_used?: string | null
          output_tokens?: number | null
          status?: string | null
        }
        Update: {
          analysis_result?: Json
          content_zone_bounds?: Json | null
          created_at?: string | null
          creative_id?: string
          detected_zones?: Json
          error_message?: string | null
          estimated_cost_usd?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string
          input_tokens?: number | null
          model_used?: string | null
          output_tokens?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "color_analysis_cache_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: true
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_feedback: {
        Row: {
          admin_response: string | null
          analyzed: boolean | null
          analyzed_at: string | null
          comment: string | null
          created_at: string | null
          creative_id: string | null
          creative_type: string
          form_data: Json | null
          had_prevention_applied: boolean | null
          id: string
          issue_categories: string[] | null
          organization_id: string | null
          prevention_action_id: string | null
          priority: string | null
          prompt_used: string | null
          rating: number | null
          responded_at: string | null
          responded_by: string | null
          status: string | null
          user_id: string | null
          vertical: string | null
        }
        Insert: {
          admin_response?: string | null
          analyzed?: boolean | null
          analyzed_at?: string | null
          comment?: string | null
          created_at?: string | null
          creative_id?: string | null
          creative_type: string
          form_data?: Json | null
          had_prevention_applied?: boolean | null
          id?: string
          issue_categories?: string[] | null
          organization_id?: string | null
          prevention_action_id?: string | null
          priority?: string | null
          prompt_used?: string | null
          rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          user_id?: string | null
          vertical?: string | null
        }
        Update: {
          admin_response?: string | null
          analyzed?: boolean | null
          analyzed_at?: string | null
          comment?: string | null
          created_at?: string | null
          creative_id?: string | null
          creative_type?: string
          form_data?: Json | null
          had_prevention_applied?: boolean | null
          id?: string
          issue_categories?: string[] | null
          organization_id?: string | null
          prevention_action_id?: string | null
          priority?: string | null
          prompt_used?: string | null
          rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          user_id?: string | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_feedback_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_feedback_prevention_action_id_fkey"
            columns: ["prevention_action_id"]
            isOneToOne: false
            referencedRelation: "prevention_actions"
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
          external_event_id: string | null
          external_event_source: string | null
          form_data: Json
          generation_time_ms: number | null
          id: string
          image_url: string
          is_favorite: boolean | null
          logo_config: Json | null
          organization_id: string
          prevention_applied: boolean | null
          prevention_holdout: boolean | null
          prompt_used: string | null
          shuffled_at: string | null
          shuffled_color_mapping: Json | null
          shuffled_image_url: string | null
          synced_event_id: string | null
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
          external_event_id?: string | null
          external_event_source?: string | null
          form_data: Json
          generation_time_ms?: number | null
          id?: string
          image_url: string
          is_favorite?: boolean | null
          logo_config?: Json | null
          organization_id: string
          prevention_applied?: boolean | null
          prevention_holdout?: boolean | null
          prompt_used?: string | null
          shuffled_at?: string | null
          shuffled_color_mapping?: Json | null
          shuffled_image_url?: string | null
          synced_event_id?: string | null
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
          external_event_id?: string | null
          external_event_source?: string | null
          form_data?: Json
          generation_time_ms?: number | null
          id?: string
          image_url?: string
          is_favorite?: boolean | null
          logo_config?: Json | null
          organization_id?: string
          prevention_applied?: boolean | null
          prevention_holdout?: boolean | null
          prompt_used?: string | null
          shuffled_at?: string | null
          shuffled_color_mapping?: Json | null
          shuffled_image_url?: string | null
          synced_event_id?: string | null
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
          {
            foreignKeyName: "creatives_synced_event_id_fkey"
            columns: ["synced_event_id"]
            isOneToOne: false
            referencedRelation: "synced_events"
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
      dynamic_field_registry: {
        Row: {
          canonical_mapping: string | null
          category: string | null
          created_at: string | null
          display_order: number | null
          field_id: string
          field_label: string
          field_type: string | null
          first_seen_at: string | null
          help_text: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          last_seen_at: string | null
          max_length: number | null
          options: Json | null
          organization_id: string | null
          placeholder: string | null
          source_app_id: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          canonical_mapping?: string | null
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          field_id: string
          field_label: string
          field_type?: string | null
          first_seen_at?: string | null
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          last_seen_at?: string | null
          max_length?: number | null
          options?: Json | null
          organization_id?: string | null
          placeholder?: string | null
          source_app_id: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          canonical_mapping?: string | null
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          field_id?: string
          field_label?: string
          field_type?: string | null
          first_seen_at?: string | null
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          last_seen_at?: string | null
          max_length?: number | null
          options?: Json | null
          organization_id?: string | null
          placeholder?: string | null
          source_app_id?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_field_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sources: {
        Row: {
          api_base_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string | null
          organization_id: string
          source_app_id: string
          source_name: string
          total_syncs: number | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          api_base_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string | null
          organization_id: string
          source_app_id: string
          source_name: string
          total_syncs?: number | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          api_base_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string | null
          organization_id?: string
          source_app_id?: string
          source_name?: string
          total_syncs?: number | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      footer_presets: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "footer_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_lineage: {
        Row: {
          ab_experiment_id: string | null
          ab_variant: string | null
          adjustments_applied: Json | null
          created_at: string | null
          creative_id: string | null
          feedback_id: string | null
          feedback_rating: number | null
          feedback_received_at: string | null
          format_id: string
          id: string
          organization_id: string | null
          patterns_matched: string[] | null
          pipeline_trace: Json
          prevention_action_id: string | null
          prevention_helped: boolean | null
          processing_time_ms: number | null
          shadow_mode: boolean | null
          user_id: string | null
          vision_analysis_id: string | null
        }
        Insert: {
          ab_experiment_id?: string | null
          ab_variant?: string | null
          adjustments_applied?: Json | null
          created_at?: string | null
          creative_id?: string | null
          feedback_id?: string | null
          feedback_rating?: number | null
          feedback_received_at?: string | null
          format_id: string
          id?: string
          organization_id?: string | null
          patterns_matched?: string[] | null
          pipeline_trace: Json
          prevention_action_id?: string | null
          prevention_helped?: boolean | null
          processing_time_ms?: number | null
          shadow_mode?: boolean | null
          user_id?: string | null
          vision_analysis_id?: string | null
        }
        Update: {
          ab_experiment_id?: string | null
          ab_variant?: string | null
          adjustments_applied?: Json | null
          created_at?: string | null
          creative_id?: string | null
          feedback_id?: string | null
          feedback_rating?: number | null
          feedback_received_at?: string | null
          format_id?: string
          id?: string
          organization_id?: string | null
          patterns_matched?: string[] | null
          pipeline_trace?: Json
          prevention_action_id?: string | null
          prevention_helped?: boolean | null
          processing_time_ms?: number | null
          shadow_mode?: boolean | null
          user_id?: string | null
          vision_analysis_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lineage_vision_analysis"
            columns: ["vision_analysis_id"]
            isOneToOne: false
            referencedRelation: "vision_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_lineage_ab_experiment_id_fkey"
            columns: ["ab_experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_lineage_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_lineage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_lineage_prevention_action_id_fkey"
            columns: ["prevention_action_id"]
            isOneToOne: false
            referencedRelation: "prevention_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_connections: {
        Row: {
          access_token_encrypted: string | null
          calendar_id: string
          calendar_name: string | null
          calendar_timezone: string | null
          connected_at: string | null
          connected_by: string | null
          created_at: string | null
          error_count: number | null
          google_account_email: string | null
          google_account_id: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          organization_id: string
          push_channel_expiry: string | null
          push_channel_id: string | null
          push_channel_token: string | null
          push_resource_id: string | null
          refresh_token_encrypted: string | null
          sync_error: string | null
          sync_future_days: number | null
          sync_past_days: number | null
          sync_status: string | null
          sync_token: string | null
          token_expiry: string | null
          total_events_synced: number | null
          total_syncs: number | null
          updated_at: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          calendar_id?: string
          calendar_name?: string | null
          calendar_timezone?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          error_count?: number | null
          google_account_email?: string | null
          google_account_id?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_id: string
          push_channel_expiry?: string | null
          push_channel_id?: string | null
          push_channel_token?: string | null
          push_resource_id?: string | null
          refresh_token_encrypted?: string | null
          sync_error?: string | null
          sync_future_days?: number | null
          sync_past_days?: number | null
          sync_status?: string | null
          sync_token?: string | null
          token_expiry?: string | null
          total_events_synced?: number | null
          total_syncs?: number | null
          updated_at?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          calendar_id?: string
          calendar_name?: string | null
          calendar_timezone?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          error_count?: number | null
          google_account_email?: string | null
          google_account_id?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_id?: string
          push_channel_expiry?: string | null
          push_channel_id?: string | null
          push_channel_token?: string | null
          push_resource_id?: string | null
          refresh_token_encrypted?: string | null
          sync_error?: string | null
          sync_future_days?: number | null
          sync_past_days?: number | null
          sync_status?: string | null
          sync_token?: string | null
          token_expiry?: string | null
          total_events_synced?: number | null
          total_syncs?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_push_logs: {
        Row: {
          channel_id: string | null
          connection_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_type: string
          events_added: number | null
          events_deleted: number | null
          events_updated: number | null
          id: string
          message_number: string | null
          organization_id: string | null
          request_headers: Json | null
          resource_id: string | null
          resource_state: string | null
          response_payload: Json | null
          success: boolean | null
        }
        Insert: {
          channel_id?: string | null
          connection_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          events_added?: number | null
          events_deleted?: number | null
          events_updated?: number | null
          id?: string
          message_number?: string | null
          organization_id?: string | null
          request_headers?: Json | null
          resource_id?: string | null
          resource_state?: string | null
          response_payload?: Json | null
          success?: boolean | null
        }
        Update: {
          channel_id?: string | null
          connection_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          events_added?: number | null
          events_deleted?: number | null
          events_updated?: number | null
          id?: string
          message_number?: string | null
          organization_id?: string | null
          request_headers?: Json | null
          resource_id?: string | null
          resource_state?: string | null
          response_payload?: Json | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_push_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_calendar_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_push_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_presets: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "initiative_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_patches: {
        Row: {
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          applied_at: string | null
          auto_generated: boolean | null
          created_at: string | null
          feedback_count: number | null
          feedback_ids: string[] | null
          id: string
          learned_pattern_id: string | null
          original_content: string | null
          patch_type: string
          pattern_confidence: number | null
          proposed_content: string
          reasoning: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          target_file: string
        }
        Insert: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          applied_at?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          feedback_count?: number | null
          feedback_ids?: string[] | null
          id?: string
          learned_pattern_id?: string | null
          original_content?: string | null
          patch_type: string
          pattern_confidence?: number | null
          proposed_content: string
          reasoning: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_file: string
        }
        Update: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          applied_at?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          feedback_count?: number | null
          feedback_ids?: string[] | null
          id?: string
          learned_pattern_id?: string | null
          original_content?: string | null
          patch_type?: string
          pattern_confidence?: number | null
          proposed_content?: string
          reasoning?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_file?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_patches_learned_pattern_id_fkey"
            columns: ["learned_pattern_id"]
            isOneToOne: false
            referencedRelation: "learned_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          patches_applied: string[] | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          patches_applied?: string[] | null
          snapshot: Json
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          patches_applied?: string[] | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: []
      }
      landmark_signatures: {
        Row: {
          city: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          file_size_bytes: number | null
          file_url: string
          height: number | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          region: string | null
          thumbnail_url: string | null
          updated_at: string | null
          width: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size_bytes?: number | null
          file_url: string
          height?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          region?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size_bytes?: number | null
          file_url?: string
          height?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          region?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "landmark_signatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learned_patterns: {
        Row: {
          confidence: number
          created_at: string | null
          created_from_feedback_ids: string[]
          embedding: Json | null
          feedback_improvement: number | null
          fix_mapping: Json
          id: string
          issue_signature: Json
          last_evaluated: string | null
          pattern_type: string
          status: string
          success_rate: number | null
          times_applied: number | null
          updated_at: string | null
        }
        Insert: {
          confidence: number
          created_at?: string | null
          created_from_feedback_ids?: string[]
          embedding?: Json | null
          feedback_improvement?: number | null
          fix_mapping: Json
          id?: string
          issue_signature: Json
          last_evaluated?: string | null
          pattern_type: string
          status?: string
          success_rate?: number | null
          times_applied?: number | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string | null
          created_from_feedback_ids?: string[]
          embedding?: Json | null
          feedback_improvement?: number | null
          fix_mapping?: Json
          id?: string
          issue_signature?: Json
          last_evaluated?: string | null
          pattern_type?: string
          status?: string
          success_rate?: number | null
          times_applied?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_agent_sessions: {
        Row: {
          adjustments_suggested: number | null
          completed_at: string | null
          duration_ms: number | null
          estimated_cost_usd: number | null
          id: string
          input_summary: Json | null
          mode: string
          organization_id: string | null
          output_summary: Json | null
          patches_created: number | null
          patterns_matched: number | null
          started_at: string | null
          state_snapshot: Json | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          adjustments_suggested?: number | null
          completed_at?: string | null
          duration_ms?: number | null
          estimated_cost_usd?: number | null
          id?: string
          input_summary?: Json | null
          mode: string
          organization_id?: string | null
          output_summary?: Json | null
          patches_created?: number | null
          patterns_matched?: number | null
          started_at?: string | null
          state_snapshot?: Json | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          adjustments_suggested?: number | null
          completed_at?: string | null
          duration_ms?: number | null
          estimated_cost_usd?: number | null
          id?: string
          input_summary?: Json | null
          mode?: string
          organization_id?: string | null
          output_summary?: Json | null
          patches_created?: number | null
          patterns_matched?: number | null
          started_at?: string | null
          state_snapshot?: Json | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_agent_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_queue: {
        Row: {
          created_at: string | null
          creative_id: string | null
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          max_retries: number | null
          organization_id: string | null
          pattern_id: string | null
          priority: number | null
          processed_at: string | null
          processed_by: string | null
          result: Json | null
          retry_count: number | null
          scheduled_for: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          creative_id?: string | null
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          max_retries?: number | null
          organization_id?: string | null
          pattern_id?: string | null
          priority?: number | null
          processed_at?: string | null
          processed_by?: string | null
          result?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          creative_id?: string | null
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          max_retries?: number | null
          organization_id?: string | null
          pattern_id?: string | null
          priority?: number | null
          processed_at?: string | null
          processed_by?: string | null
          result?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_queue_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      logo_presets: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          placements: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          placements: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          placements?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logo_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          created_at: string | null
          created_by: string
          email: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          organization_id: string
          role: string
          token: string
          used_at: string | null
          used_by: string | null
          used_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          organization_id: string
          role?: string
          token: string
          used_at?: string | null
          used_by?: string | null
          used_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          organization_id?: string
          role?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
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
          admin_notes: string | null
          admin_notes_updated_at: string | null
          admin_notes_updated_by: string | null
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
          admin_notes?: string | null
          admin_notes_updated_at?: string | null
          admin_notes_updated_by?: string | null
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
          admin_notes?: string | null
          admin_notes_updated_at?: string | null
          admin_notes_updated_by?: string | null
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
      pattern_cache_state: {
        Row: {
          cache_version: number
          expires_at: string | null
          id: string
          last_updated: string | null
          organization_id: string | null
          patterns_hash: string
          patterns_snapshot: Json
          scope: string | null
          total_patterns: number
        }
        Insert: {
          cache_version: number
          expires_at?: string | null
          id?: string
          last_updated?: string | null
          organization_id?: string | null
          patterns_hash: string
          patterns_snapshot: Json
          scope?: string | null
          total_patterns: number
        }
        Update: {
          cache_version?: number
          expires_at?: string | null
          id?: string
          last_updated?: string | null
          organization_id?: string | null
          patterns_hash?: string
          patterns_snapshot?: Json
          scope?: string | null
          total_patterns?: number
        }
        Relationships: [
          {
            foreignKeyName: "pattern_cache_state_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_understanding: {
        Row: {
          created_at: string | null
          expires_at: string
          format_specific_paths: Json
          id: string
          interconnections: Json
          key_insights: string[]
          stages: Json
          total_files: number
          version: number
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          format_specific_paths: Json
          id?: string
          interconnections: Json
          key_insights?: string[]
          stages: Json
          total_files?: number
          version: number
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          format_specific_paths?: Json
          id?: string
          interconnections?: Json
          key_insights?: string[]
          stages?: Json
          total_files?: number
          version?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      prevention_actions: {
        Row: {
          adjustments_applied: Json
          created_at: string | null
          creative_id: string | null
          feedback_rating: number | null
          fix_effective: boolean | null
          id: string
          matched_patterns: string[]
          organization_id: string | null
          session_id: string | null
          was_effective: boolean | null
        }
        Insert: {
          adjustments_applied?: Json
          created_at?: string | null
          creative_id?: string | null
          feedback_rating?: number | null
          fix_effective?: boolean | null
          id?: string
          matched_patterns?: string[]
          organization_id?: string | null
          session_id?: string | null
          was_effective?: boolean | null
        }
        Update: {
          adjustments_applied?: Json
          created_at?: string | null
          creative_id?: string | null
          feedback_rating?: number | null
          fix_effective?: boolean | null
          id?: string
          matched_patterns?: string[]
          organization_id?: string | null
          session_id?: string | null
          was_effective?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "prevention_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prevention_actions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rollback_checkpoints: {
        Row: {
          changes_summary: string | null
          checkpoint_type: string
          created_at: string | null
          created_by: string | null
          entity_id: string | null
          entity_type: string
          expires_at: string | null
          id: string
          new_state: Json
          organization_id: string | null
          previous_state: Json
          quality_score_after: number | null
          quality_score_before: number | null
          reason: string | null
          rollback_reason: string | null
          rolled_back: boolean | null
          rolled_back_at: string | null
          rolled_back_by: string | null
        }
        Insert: {
          changes_summary?: string | null
          checkpoint_type: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type: string
          expires_at?: string | null
          id?: string
          new_state: Json
          organization_id?: string | null
          previous_state: Json
          quality_score_after?: number | null
          quality_score_before?: number | null
          reason?: string | null
          rollback_reason?: string | null
          rolled_back?: boolean | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
        }
        Update: {
          changes_summary?: string | null
          checkpoint_type?: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string
          expires_at?: string | null
          id?: string
          new_state?: Json
          organization_id?: string | null
          previous_state?: Json
          quality_score_after?: number | null
          quality_score_before?: number | null
          reason?: string | null
          rollback_reason?: string | null
          rolled_back?: boolean | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rollback_checkpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seeded_patterns: {
        Row: {
          category: string
          confidence: number | null
          created_at: string | null
          description: string
          fix_mapping: Json
          format_ids: string[] | null
          id: string
          is_active: boolean | null
          issue_signature: Json
          last_applied_at: string | null
          name: string
          organization_id: string | null
          pattern_key: string
          source: string | null
          success_rate: number | null
          times_applied: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string | null
          description: string
          fix_mapping: Json
          format_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          issue_signature: Json
          last_applied_at?: string | null
          name: string
          organization_id?: string | null
          pattern_key: string
          source?: string | null
          success_rate?: number | null
          times_applied?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string | null
          description?: string
          fix_mapping?: Json
          format_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          issue_signature?: Json
          last_applied_at?: string | null
          name?: string
          organization_id?: string | null
          pattern_key?: string
          source?: string | null
          success_rate?: number | null
          times_applied?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seeded_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_mode_logs: {
        Row: {
          confidence_delta: number | null
          correlated_at: string | null
          correlation_notes: string | null
          created_at: string | null
          creative_id: string | null
          feedback_id: string | null
          feedback_rating: number | null
          format_id: string
          generation_request_id: string
          id: string
          matched_patterns: Json
          organization_id: string | null
          prediction_accurate: boolean | null
          proposed_adjustments: Json | null
          request_snapshot: Json
          user_id: string | null
          would_have_adjusted: boolean | null
        }
        Insert: {
          confidence_delta?: number | null
          correlated_at?: string | null
          correlation_notes?: string | null
          created_at?: string | null
          creative_id?: string | null
          feedback_id?: string | null
          feedback_rating?: number | null
          format_id: string
          generation_request_id: string
          id?: string
          matched_patterns?: Json
          organization_id?: string | null
          prediction_accurate?: boolean | null
          proposed_adjustments?: Json | null
          request_snapshot: Json
          user_id?: string | null
          would_have_adjusted?: boolean | null
        }
        Update: {
          confidence_delta?: number | null
          correlated_at?: string | null
          correlation_notes?: string | null
          created_at?: string | null
          creative_id?: string | null
          feedback_id?: string | null
          feedback_rating?: number | null
          format_id?: string
          generation_request_id?: string
          id?: string
          matched_patterns?: Json
          organization_id?: string | null
          prediction_accurate?: boolean | null
          proposed_adjustments?: Json | null
          request_snapshot?: Json
          user_id?: string | null
          would_have_adjusted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "shadow_mode_logs_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shadow_mode_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      success_patterns: {
        Row: {
          amplification_hints: Json | null
          application_success_rate: number | null
          avg_rating: number
          confidence: number | null
          created_at: string | null
          description: string | null
          format_id: string
          id: string
          is_active: boolean | null
          last_applied_at: string | null
          name: string
          organization_id: string | null
          pattern_key: string
          sample_count: number
          source_creative_ids: string[] | null
          success_signature: Json
          times_applied: number | null
          updated_at: string | null
        }
        Insert: {
          amplification_hints?: Json | null
          application_success_rate?: number | null
          avg_rating: number
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          format_id: string
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          name: string
          organization_id?: string | null
          pattern_key: string
          sample_count?: number
          source_creative_ids?: string[] | null
          success_signature: Json
          times_applied?: number | null
          updated_at?: string | null
        }
        Update: {
          amplification_hints?: Json | null
          application_success_rate?: number | null
          avg_rating?: number
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          format_id?: string
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          name?: string
          organization_id?: string | null
          pattern_key?: string
          sample_count?: number
          source_creative_ids?: string[] | null
          success_signature?: Json
          times_applied?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          impersonated_user_id: string | null
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          super_admin_email: string
          super_admin_id: string
          target_organization_id: string | null
          target_user_id: string | null
          user_agent: string | null
          was_impersonating: boolean | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          impersonated_user_id?: string | null
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          super_admin_email: string
          super_admin_id: string
          target_organization_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          was_impersonating?: boolean | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          impersonated_user_id?: string | null
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          super_admin_email?: string
          super_admin_id?: string
          target_organization_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          was_impersonating?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_audit_logs_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      synced_events: {
        Row: {
          allow_guests: boolean | null
          banner_image_url: string | null
          chapter_location: string | null
          chapter_name: string | null
          city: string | null
          current_registrations: number | null
          custom_data: Json | null
          description: string | null
          end_time: string | null
          entry_fee: string | null
          event_date: string
          event_name: string
          event_time: string | null
          event_type: string | null
          external_id: string
          field_metadata: Json | null
          guest_limit: number | null
          id: string
          is_featured: boolean | null
          is_virtual: boolean | null
          max_capacity: number | null
          organization_id: string
          organizer_name: string | null
          registration_deadline: string | null
          registration_start_date: string | null
          registration_url: string | null
          source_app_id: string
          source_created_at: string | null
          source_updated_at: string | null
          speakers: Json | null
          status: string | null
          synced_at: string | null
          tagline: string | null
          tags: Json | null
          target_audience: string | null
          venue: string | null
          venue_address: string | null
          venue_capacity: number | null
          venue_latitude: number | null
          venue_longitude: number | null
          virtual_meeting_link: string | null
          waitlist_enabled: boolean | null
        }
        Insert: {
          allow_guests?: boolean | null
          banner_image_url?: string | null
          chapter_location?: string | null
          chapter_name?: string | null
          city?: string | null
          current_registrations?: number | null
          custom_data?: Json | null
          description?: string | null
          end_time?: string | null
          entry_fee?: string | null
          event_date: string
          event_name: string
          event_time?: string | null
          event_type?: string | null
          external_id: string
          field_metadata?: Json | null
          guest_limit?: number | null
          id?: string
          is_featured?: boolean | null
          is_virtual?: boolean | null
          max_capacity?: number | null
          organization_id: string
          organizer_name?: string | null
          registration_deadline?: string | null
          registration_start_date?: string | null
          registration_url?: string | null
          source_app_id: string
          source_created_at?: string | null
          source_updated_at?: string | null
          speakers?: Json | null
          status?: string | null
          synced_at?: string | null
          tagline?: string | null
          tags?: Json | null
          target_audience?: string | null
          venue?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          virtual_meeting_link?: string | null
          waitlist_enabled?: boolean | null
        }
        Update: {
          allow_guests?: boolean | null
          banner_image_url?: string | null
          chapter_location?: string | null
          chapter_name?: string | null
          city?: string | null
          current_registrations?: number | null
          custom_data?: Json | null
          description?: string | null
          end_time?: string | null
          entry_fee?: string | null
          event_date?: string
          event_name?: string
          event_time?: string | null
          event_type?: string | null
          external_id?: string
          field_metadata?: Json | null
          guest_limit?: number | null
          id?: string
          is_featured?: boolean | null
          is_virtual?: boolean | null
          max_capacity?: number | null
          organization_id?: string
          organizer_name?: string | null
          registration_deadline?: string | null
          registration_start_date?: string | null
          registration_url?: string | null
          source_app_id?: string
          source_created_at?: string | null
          source_updated_at?: string | null
          speakers?: Json | null
          status?: string | null
          synced_at?: string | null
          tagline?: string | null
          tags?: Json | null
          target_audience?: string | null
          venue?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          virtual_meeting_link?: string | null
          waitlist_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "synced_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      vertical_logo_presets: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          logo_ids: string[]
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          logo_ids?: string[]
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          logo_ids?: string[]
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_logo_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      vision_analysis: {
        Row: {
          brand_consistency_score: number | null
          category_scores: Json | null
          color_harmony_score: number | null
          composition_score: number | null
          created_at: string | null
          creative_id: string | null
          detected_issues: Json
          flag_for_review: boolean | null
          format_id: string
          id: string
          image_url: string
          logo_placement_score: number | null
          model_used: string | null
          organization_id: string | null
          overall_score: number | null
          processing_time_ms: number | null
          raw_response: Json | null
          review_completed: boolean | null
          review_notes: string | null
          review_reasons: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          text_readability_score: number | null
        }
        Insert: {
          brand_consistency_score?: number | null
          category_scores?: Json | null
          color_harmony_score?: number | null
          composition_score?: number | null
          created_at?: string | null
          creative_id?: string | null
          detected_issues?: Json
          flag_for_review?: boolean | null
          format_id: string
          id?: string
          image_url: string
          logo_placement_score?: number | null
          model_used?: string | null
          organization_id?: string | null
          overall_score?: number | null
          processing_time_ms?: number | null
          raw_response?: Json | null
          review_completed?: boolean | null
          review_notes?: string | null
          review_reasons?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          text_readability_score?: number | null
        }
        Update: {
          brand_consistency_score?: number | null
          category_scores?: Json | null
          color_harmony_score?: number | null
          composition_score?: number | null
          created_at?: string | null
          creative_id?: string | null
          detected_issues?: Json
          flag_for_review?: boolean | null
          format_id?: string
          id?: string
          image_url?: string
          logo_placement_score?: number | null
          model_used?: string | null
          organization_id?: string | null
          overall_score?: number | null
          processing_time_ms?: number | null
          raw_response?: Json | null
          review_completed?: boolean | null
          review_notes?: string | null
          review_reasons?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          text_readability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vision_analysis_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vision_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          action: string
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_name: string | null
          event_source_id: string | null
          external_event_id: string | null
          id: string
          ip_address: string | null
          organization_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          source_app_id: string
          status: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_name?: string | null
          event_source_id?: string | null
          external_event_id?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          source_app_id: string
          status: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_name?: string | null
          event_source_id?: string | null
          external_event_id?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          source_app_id?: string
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_event_source_id_fkey"
            columns: ["event_source_id"]
            isOneToOne: false
            referencedRelation: "event_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      backfill_all_api_usage_creative_ids: {
        Args: never
        Returns: {
          creative_id: string
          linked_count: number
        }[]
      }
      backfill_api_usage_creative_id: {
        Args: {
          p_created_at: string
          p_creative_id: string
          p_organization_id: string
          p_user_id: string
          p_window_seconds?: number
        }
        Returns: number
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
      check_user_membership_exists: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      check_valid_invite_for_join: {
        Args: { p_organization_id: string; p_role: string }
        Returns: boolean
      }
      cleanup_expired_color_cache: { Args: never; Returns: number }
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
      generate_push_channel_token: {
        Args: { p_organization_id: string }
        Returns: string
      }
      get_api_usage_analytics: {
        Args: { org_id: string; start_date?: string }
        Returns: {
          avg_duration_ms: number
          model: string
          provider: string
          request_count: number
          request_type: string
          success_count: number
          total_cached_tokens: number
          total_cost_usd: number
          total_images: number
          total_input_tokens: number
          total_output_tokens: number
        }[]
      }
      get_creative_analytics: {
        Args: { org_id: string; start_date?: string }
        Returns: {
          avg_generation_time_ms: number
          creatives_by_model: Json
          creatives_by_type: Json
          creatives_by_vertical: Json
          total_creatives: number
          total_credits_used: number
          total_downloads: number
        }[]
      }
      get_daily_usage_trend: {
        Args: { org_id: string; start_date?: string }
        Returns: {
          cached_tokens: number
          image_count: number
          input_tokens: number
          output_tokens: number
          request_count: number
          total_cost_usd: number
          usage_date: string
        }[]
      }
      get_google_calendar_tokens:
        | {
            Args: { p_connection_id: string }
            Returns: {
              access_token: string
              refresh_token: string
              token_expiry: string
            }[]
          }
        | {
            Args: { p_connection_id: string; p_encryption_key: string }
            Returns: {
              access_token: string
              refresh_token: string
              token_expiry: string
            }[]
          }
      get_recent_api_usage: {
        Args: { org_id: string; record_limit?: number; start_date?: string }
        Returns: {
          created_at: string
          duration_ms: number
          estimated_cost_usd: number
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          provider: string
          request_type: string
          success: boolean
        }[]
      }
      get_user_org_role: { Args: { org_id: string }; Returns: string }
      increment_dynamic_field_usage: {
        Args: { p_field_id: string; p_org_id: string; p_source_id: string }
        Returns: undefined
      }
      increment_event_source_sync: {
        Args: {
          p_is_error?: boolean
          p_organization_id: string
          p_source_app_id: string
        }
        Returns: undefined
      }
      increment_template_use_count: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_current_user_super_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_user_super_admin: { Args: { user_id: string }; Returns: boolean }
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
      store_google_calendar_tokens:
        | {
            Args: {
              p_access_token: string
              p_connection_id: string
              p_refresh_token: string
              p_token_expiry: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_access_token: string
              p_connection_id: string
              p_encryption_key: string
              p_refresh_token: string
              p_token_expiry: string
            }
            Returns: undefined
          }
      update_google_calendar_sync_stats: {
        Args: {
          p_connection_id: string
          p_error_message?: string
          p_events_synced?: number
          p_is_error?: boolean
        }
        Returns: undefined
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

// Helper type aliases for commonly used tables
export type Template = Database['public']['Tables']['templates']['Row']
export type TemplateImage = Database['public']['Tables']['template_images']['Row']
export type VerticalPreset = Database['public']['Tables']['vertical_presets']['Row']
export type AIModel = Database['public']['Tables']['ai_models']['Row']
export type Creative = Database['public']['Tables']['creatives']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type OrganizationLogo = Database['public']['Tables']['organization_logos']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row']
export type GoogleCalendarConnection = Database['public']['Tables']['google_calendar_connections']['Row']
export type GoogleCalendarPushLog = Database['public']['Tables']['google_calendar_push_logs']['Row']
