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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_balance_settings: {
        Row: {
          created_at: string
          opening_balance: number
          opening_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opening_balance: number
          opening_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          opening_balance?: number
          opening_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_adjustments: {
        Row: {
          adjustment_needed: number
          baseline_projected_total: number
          created_at: string
          month: string
          suggested_weekly_reduction: number
          target_remaining_spend: number
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustment_needed: number
          baseline_projected_total: number
          created_at?: string
          month: string
          suggested_weekly_reduction: number
          target_remaining_spend: number
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustment_needed?: number
          baseline_projected_total?: number
          created_at?: string
          month?: string
          suggested_weekly_reduction?: number
          target_remaining_spend?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          budget: number
          category: string
          color: string
          created_at: string
          id: string
          month: string
          subtitle: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget: number
          category: string
          color: string
          created_at?: string
          id: string
          month: string
          subtitle: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number
          category?: string
          color?: string
          created_at?: string
          id?: string
          month?: string
          subtitle?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          archived_at: string | null
          color_token: string
          created_at: string
          icon_key: string
          id: string
          name: string
          normalized_name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color_token: string
          created_at?: string
          icon_key: string
          id?: string
          name: string
          normalized_name?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          color_token?: string
          created_at?: string
          icon_key?: string
          id?: string
          name?: string
          normalized_name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_contribution_plans: {
        Row: {
          baseline_required_monthly_contribution: number
          created_at: string
          goal_id: string
          monthly_target: number
          savings_boost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_required_monthly_contribution: number
          created_at?: string
          goal_id: string
          monthly_target: number
          savings_boost: number
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_required_monthly_contribution?: number
          created_at?: string
          goal_id?: string
          monthly_target?: number
          savings_boost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contribution_plans_goal_fk"
            columns: ["user_id", "goal_id"]
            isOneToOne: true
            referencedRelation: "goals"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          id: string
          name: string
          priority: string
          saved_amount: number
          target_amount: number
          target_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          priority: string
          saved_amount: number
          target_amount: number
          target_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          priority?: string
          saved_amount?: number
          target_amount?: number
          target_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          asset_type: string
          average_purchase_price: number
          created_at: string
          id: string
          manual_current_price: number | null
          market_asset_key: string | null
          name: string
          native_currency: string
          price_mode: string
          quantity: number
          symbol: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          average_purchase_price: number
          created_at?: string
          id: string
          manual_current_price?: number | null
          market_asset_key?: string | null
          name: string
          native_currency: string
          price_mode: string
          quantity: number
          symbol?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          average_purchase_price?: number
          created_at?: string
          id?: string
          manual_current_price?: number | null
          market_asset_key?: string | null
          name?: string
          native_currency?: string
          price_mode?: string
          quantity?: number
          symbol?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_mode: string
          avatar_path: string | null
          created_at: string
          currency_code: string
          display_name: string | null
          has_seen_welcome: boolean
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          avatar_mode?: string
          avatar_path?: string | null
          created_at?: string
          currency_code?: string
          display_name?: string | null
          has_seen_welcome?: boolean
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          avatar_mode?: string
          avatar_path?: string | null
          created_at?: string
          currency_code?: string
          display_name?: string | null
          has_seen_welcome?: boolean
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          category_color: string
          category_color_snapshot: string | null
          category_id: string | null
          category_name_snapshot: string | null
          created_at: string
          date: string
          date_iso: string
          description: string
          id: string
          normalized_category_snapshot: string | null
          origin: string
          payment: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          category_color: string
          category_color_snapshot?: string | null
          category_id?: string | null
          category_name_snapshot?: string | null
          created_at?: string
          date: string
          date_iso: string
          description: string
          id: string
          normalized_category_snapshot?: string | null
          origin: string
          payment: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          category_color?: string
          category_color_snapshot?: string | null
          category_id?: string | null
          category_name_snapshot?: string | null
          created_at?: string
          date?: string
          date_iso?: string
          description?: string
          id?: string
          normalized_category_snapshot?: string | null
          origin?: string
          payment?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_owner_type_fk"
            columns: ["user_id", "category_id", "type"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["user_id", "id", "type"]
          },
        ]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
