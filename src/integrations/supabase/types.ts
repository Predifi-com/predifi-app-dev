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
      activity_feed: {
        Row: {
          activity_type: string
          amount: string | null
          created_at: string
          id: string
          metadata: Json | null
          token: string | null
          user_address: string
        }
        Insert: {
          activity_type: string
          amount?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          token?: string | null
          user_address: string
        }
        Update: {
          activity_type?: string
          amount?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          token?: string | null
          user_address?: string
        }
        Relationships: []
      }
      ai_model_accuracy: {
        Row: {
          accuracy_rate: number
          avg_trust_score: number
          brier_score: number | null
          calibration_data: Json | null
          correct_predictions: number
          id: string
          last_updated: string
          model_name: string
          model_provider: string
          total_predictions: number
        }
        Insert: {
          accuracy_rate?: number
          avg_trust_score?: number
          brier_score?: number | null
          calibration_data?: Json | null
          correct_predictions?: number
          id?: string
          last_updated?: string
          model_name: string
          model_provider: string
          total_predictions?: number
        }
        Update: {
          accuracy_rate?: number
          avg_trust_score?: number
          brier_score?: number | null
          calibration_data?: Json | null
          correct_predictions?: number
          id?: string
          last_updated?: string
          model_name?: string
          model_provider?: string
          total_predictions?: number
        }
        Relationships: []
      }
      ai_model_outcomes: {
        Row: {
          actual_outcome: string
          created_at: string
          id: string
          market_id: string
          resolved_at: string
        }
        Insert: {
          actual_outcome: string
          created_at?: string
          id?: string
          market_id: string
          resolved_at?: string
        }
        Update: {
          actual_outcome?: string
          created_at?: string
          id?: string
          market_id?: string
          resolved_at?: string
        }
        Relationships: []
      }
      ai_model_predictions: {
        Row: {
          actual_outcome_won: boolean | null
          brier_contribution: number | null
          confidence: string
          created_at: string
          data_points_cited: number
          id: string
          is_resolved: boolean | null
          market_id: string
          market_probability: number | null
          market_title: string
          model_name: string
          model_provider: string
          outcome_label: string | null
          predicted_probability: number | null
          predicted_sentiment: string
          resolved_at: string | null
          trust_score: number
        }
        Insert: {
          actual_outcome_won?: boolean | null
          brier_contribution?: number | null
          confidence: string
          created_at?: string
          data_points_cited?: number
          id?: string
          is_resolved?: boolean | null
          market_id: string
          market_probability?: number | null
          market_title: string
          model_name: string
          model_provider: string
          outcome_label?: string | null
          predicted_probability?: number | null
          predicted_sentiment: string
          resolved_at?: string | null
          trust_score: number
        }
        Update: {
          actual_outcome_won?: boolean | null
          brier_contribution?: number | null
          confidence?: string
          created_at?: string
          data_points_cited?: number
          id?: string
          is_resolved?: boolean | null
          market_id?: string
          market_probability?: number | null
          market_title?: string
          model_name?: string
          model_provider?: string
          outcome_label?: string | null
          predicted_probability?: number | null
          predicted_sentiment?: string
          resolved_at?: string | null
          trust_score?: number
        }
        Relationships: []
      }
      arena_admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      arena_competitions: {
        Row: {
          competition_end: string
          competition_number: number
          competition_start: string
          created_at: string
          fcfs_slots: number | null
          fcfs_slots_remaining: number | null
          id: string
          is_finale: boolean
          is_whitelist_only: boolean
          max_participants: number | null
          registration_end: string | null
          registration_start: string | null
          season_id: string
          status: Database["public"]["Enums"]["arena_competition_status"]
          updated_at: string
        }
        Insert: {
          competition_end: string
          competition_number: number
          competition_start: string
          created_at?: string
          fcfs_slots?: number | null
          fcfs_slots_remaining?: number | null
          id?: string
          is_finale?: boolean
          is_whitelist_only?: boolean
          max_participants?: number | null
          registration_end?: string | null
          registration_start?: string | null
          season_id: string
          status?: Database["public"]["Enums"]["arena_competition_status"]
          updated_at?: string
        }
        Update: {
          competition_end?: string
          competition_number?: number
          competition_start?: string
          created_at?: string
          fcfs_slots?: number | null
          fcfs_slots_remaining?: number | null
          id?: string
          is_finale?: boolean
          is_whitelist_only?: boolean
          max_participants?: number | null
          registration_end?: string | null
          registration_start?: string | null
          season_id?: string
          status?: Database["public"]["Enums"]["arena_competition_status"]
          updated_at?: string
        }
        Relationships: []
      }
      arena_notification_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          unsubscribed_at: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          unsubscribed_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          unsubscribed_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      arena_performance: {
        Row: {
          competition_id: string
          current_balance: number
          id: string
          last_trade_at: string | null
          open_positions_count: number
          realized_pnl: number
          registration_id: string
          roi_percent: number | null
          starting_capital: number
          total_pnl: number | null
          trade_count: number
          unrealized_pnl: number
          updated_at: string
          wallet_address: string
        }
        Insert: {
          competition_id: string
          current_balance?: number
          id?: string
          last_trade_at?: string | null
          open_positions_count?: number
          realized_pnl?: number
          registration_id: string
          roi_percent?: number | null
          starting_capital?: number
          total_pnl?: number | null
          trade_count?: number
          unrealized_pnl?: number
          updated_at?: string
          wallet_address: string
        }
        Update: {
          competition_id?: string
          current_balance?: number
          id?: string
          last_trade_at?: string | null
          open_positions_count?: number
          realized_pnl?: number
          registration_id?: string
          roi_percent?: number | null
          starting_capital?: number
          total_pnl?: number | null
          trade_count?: number
          unrealized_pnl?: number
          updated_at?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_performance_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "arena_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_performance_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "arena_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_qualifications: {
        Row: {
          competition_id: string
          final_rank: number
          final_roi: number
          id: string
          qualified_at: string
          qualified_for_finale: boolean
          wallet_address: string
        }
        Insert: {
          competition_id: string
          final_rank: number
          final_roi: number
          id?: string
          qualified_at?: string
          qualified_for_finale?: boolean
          wallet_address: string
        }
        Update: {
          competition_id?: string
          final_rank?: number
          final_roi?: number
          id?: string
          qualified_at?: string
          qualified_for_finale?: boolean
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_qualifications_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "arena_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_registrations: {
        Row: {
          admission_type: string
          arena_wallet_address: string | null
          competition_id: string
          deposit_amount: number
          deposit_confirmed: boolean
          id: string
          registered_at: string
          rules_accepted: boolean
          rules_accepted_at: string | null
          status: Database["public"]["Enums"]["arena_competitor_status"]
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          admission_type?: string
          arena_wallet_address?: string | null
          competition_id: string
          deposit_amount?: number
          deposit_confirmed?: boolean
          id?: string
          registered_at?: string
          rules_accepted?: boolean
          rules_accepted_at?: string | null
          status?: Database["public"]["Enums"]["arena_competitor_status"]
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          admission_type?: string
          arena_wallet_address?: string | null
          competition_id?: string
          deposit_amount?: number
          deposit_confirmed?: boolean
          id?: string
          registered_at?: string
          rules_accepted?: boolean
          rules_accepted_at?: string | null
          status?: Database["public"]["Enums"]["arena_competitor_status"]
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "arena_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_trades: {
        Row: {
          closed_at: string | null
          competition_id: string
          direction: string
          entry_price: number | null
          exit_price: number | null
          id: string
          market: string
          opened_at: string
          performance_id: string
          pnl: number | null
          size: number
          status: string
          wallet_address: string
        }
        Insert: {
          closed_at?: string | null
          competition_id: string
          direction: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          market: string
          opened_at?: string
          performance_id: string
          pnl?: number | null
          size: number
          status?: string
          wallet_address: string
        }
        Update: {
          closed_at?: string | null
          competition_id?: string
          direction?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          market?: string
          opened_at?: string
          performance_id?: string
          pnl?: number | null
          size?: number
          status?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_trades_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "arena_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_trades_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "arena_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_whitelist: {
        Row: {
          added_at: string
          added_by: string | null
          competition_id: string | null
          id: string
          wallet_address: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          competition_id?: string | null
          id?: string
          wallet_address: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          competition_id?: string | null
          id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_whitelist_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "arena_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_markets: {
        Row: {
          category: string
          created_at: string | null
          creator_id: string
          description: string | null
          end_date: string | null
          id: string
          initial_probability: number | null
          market_id: string | null
          question: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          creator_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          initial_probability?: number | null
          market_id?: string | null
          question: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          creator_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          initial_probability?: number | null
          market_id?: string | null
          question?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_matches: {
        Row: {
          buy_order_id: string
          created_at: string
          id: string
          matched_price: string
          matched_size: string
          sell_order_id: string
          settled_at: string | null
          settlement_tx_hash: string | null
        }
        Insert: {
          buy_order_id: string
          created_at?: string
          id?: string
          matched_price: string
          matched_size: string
          sell_order_id: string
          settled_at?: string | null
          settlement_tx_hash?: string | null
        }
        Update: {
          buy_order_id?: string
          created_at?: string
          id?: string
          matched_price?: string
          matched_size?: string
          sell_order_id?: string
          settled_at?: string | null
          settlement_tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_matches_buy_order_id_fkey"
            columns: ["buy_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_matches_sell_order_id_fkey"
            columns: ["sell_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          expiry: string
          filled_size: string | null
          id: string
          maker_address: string
          market_id: string
          nonce: string
          outcome: string
          price: string
          signature: string
          size: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry: string
          filled_size?: string | null
          id?: string
          maker_address: string
          market_id: string
          nonce: string
          outcome: string
          price: string
          signature: string
          size: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry?: string
          filled_size?: string | null
          id?: string
          maker_address?: string
          market_id?: string
          nonce?: string
          outcome?: string
          price?: string
          signature?: string
          size?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_whitelist: {
        Row: {
          added_by: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          wallet_address: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          wallet_address?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          condition: string
          created_at: string
          id: string
          is_active: boolean
          market_id: string
          market_title: string
          target_price: number
          triggered_at: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          condition: string
          created_at?: string
          id?: string
          is_active?: boolean
          market_id: string
          market_title: string
          target_price: number
          triggered_at?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          is_active?: boolean
          market_id?: string
          market_title?: string
          target_price?: number
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          user_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          user_address: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          user_address?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referee_address: string
          referral_code: string
          referrer_address: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referee_address: string
          referral_code: string
          referrer_address: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referee_address?: string
          referral_code?: string
          referrer_address?: string
          status?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          amount: number
          claimed: boolean
          created_at: string
          description: string | null
          id: string
          reward_type: string
          user_address: string
        }
        Insert: {
          amount: number
          claimed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          reward_type: string
          user_address: string
        }
        Update: {
          amount?: number
          claimed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          reward_type?: string
          user_address?: string
        }
        Relationships: []
      }
      soft_staking: {
        Row: {
          balance_warnings: number | null
          committed_amount: string
          created_at: string
          id: string
          last_balance_check: string | null
          nonce: string | null
          notes: string | null
          signature: string | null
          status: string
          token: string
          updated_at: string
          user_address: string
          yield_active: boolean | null
        }
        Insert: {
          balance_warnings?: number | null
          committed_amount: string
          created_at?: string
          id?: string
          last_balance_check?: string | null
          nonce?: string | null
          notes?: string | null
          signature?: string | null
          status?: string
          token: string
          updated_at?: string
          user_address: string
          yield_active?: boolean | null
        }
        Update: {
          balance_warnings?: number | null
          committed_amount?: string
          created_at?: string
          id?: string
          last_balance_check?: string | null
          nonce?: string | null
          notes?: string | null
          signature?: string | null
          status?: string
          token?: string
          updated_at?: string
          user_address?: string
          yield_active?: boolean | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          achieved_at: string
          id: string
          milestone_tier: string
          reward_amount: number
          user_address: string
        }
        Insert: {
          achieved_at?: string
          id?: string
          milestone_tier: string
          reward_amount: number
          user_address: string
        }
        Update: {
          achieved_at?: string
          id?: string
          milestone_tier?: string
          reward_amount?: number
          user_address?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          email_notifications: boolean | null
          language: string | null
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          email_notifications?: boolean | null
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          email_notifications?: boolean | null
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      vault_stats: {
        Row: {
          apy: number
          id: string
          strategy: string
          token: string
          tvl: string
          updated_at: string
          vault_name: string
        }
        Insert: {
          apy: number
          id?: string
          strategy: string
          token: string
          tvl: string
          updated_at?: string
          vault_name: string
        }
        Update: {
          apy?: number
          id?: string
          strategy?: string
          token?: string
          tvl?: string
          updated_at?: string
          vault_name?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          approved_at: string | null
          created_at: string
          email: string
          id: string
          priority_score: number | null
          referral_code: string | null
          referral_count: number | null
          referral_source: string | null
          referred_by: string | null
          wallet_address: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          email: string
          id?: string
          priority_score?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referral_source?: string | null
          referred_by?: string | null
          wallet_address?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          email?: string
          id?: string
          priority_score?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referral_source?: string | null
          referred_by?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      wallet_balance_snapshots: {
        Row: {
          balance: string
          below_commitment: boolean
          checked_at: string
          commitment_id: string | null
          created_at: string
          id: string
          token: string
          user_address: string
        }
        Insert: {
          balance: string
          below_commitment?: boolean
          checked_at?: string
          commitment_id?: string | null
          created_at?: string
          id?: string
          token: string
          user_address: string
        }
        Update: {
          balance?: string
          below_commitment?: boolean
          checked_at?: string
          commitment_id?: string | null
          created_at?: string
          id?: string
          token?: string
          user_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_balance_snapshots_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "soft_staking"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_prediction_brier: {
        Args: { p_actual_won: boolean; p_predicted_probability: number }
        Returns: number
      }
      calculate_soft_staking_rewards: {
        Args: { p_commitment_id: string; p_user_address: string }
        Returns: number
      }
      get_referral_code: {
        Args: { code: string }
        Returns: {
          created_at: string
          id: string
          referral_code: string
          user_address: string
        }[]
      }
      get_waitlist_position: { Args: { user_email: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_wallet: { Args: { _wallet_address: string }; Returns: boolean }
      is_whitelisted: {
        Args: { check_email?: string; check_wallet?: string }
        Returns: boolean
      }
      recalculate_model_calibration: {
        Args: { p_model_name: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      arena_competition_status:
        | "UPCOMING"
        | "REGISTERING"
        | "LIVE"
        | "FINALIZED"
      arena_competitor_status:
        | "REGISTERED"
        | "ACTIVE"
        | "QUALIFIED"
        | "ELIMINATED"
        | "WITHDRAWN"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      arena_competition_status: [
        "UPCOMING",
        "REGISTERING",
        "LIVE",
        "FINALIZED",
      ],
      arena_competitor_status: [
        "REGISTERED",
        "ACTIVE",
        "QUALIFIED",
        "ELIMINATED",
        "WITHDRAWN",
      ],
    },
  },
} as const
