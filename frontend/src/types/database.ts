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
      alerts: {
        Row: {
          algorithms_used: Json | null
          analysis_type: string | null
          aoi_id: string
          confidence: number | null
          confirmed: boolean | null
          created_at: string | null
          data_quality_score: number | null
          detections: Json | null
          gif_url: string | null
          id: string
          overall_confidence: number | null
          priority_level: string | null
          processing: boolean | null
          processing_metadata: Json | null
          processing_time_seconds: number | null
          satellite_metadata: Json | null
          spectral_indices: Json | null
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          algorithms_used?: Json | null
          analysis_type?: string | null
          aoi_id: string
          confidence?: number | null
          confirmed?: boolean | null
          created_at?: string | null
          data_quality_score?: number | null
          detections?: Json | null
          gif_url?: string | null
          id?: string
          overall_confidence?: number | null
          priority_level?: string | null
          processing?: boolean | null
          processing_metadata?: Json | null
          processing_time_seconds?: number | null
          satellite_metadata?: Json | null
          spectral_indices?: Json | null
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          algorithms_used?: Json | null
          analysis_type?: string | null
          aoi_id?: string
          confidence?: number | null
          confirmed?: boolean | null
          created_at?: string | null
          data_quality_score?: number | null
          detections?: Json | null
          gif_url?: string | null
          id?: string
          overall_confidence?: number | null
          priority_level?: string | null
          processing?: boolean | null
          processing_metadata?: Json | null
          processing_time_seconds?: number | null
          satellite_metadata?: Json | null
          spectral_indices?: Json | null
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_aoi_id_fkey"
            columns: ["aoi_id"]
            isOneToOne: false
            referencedRelation: "aois"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          analysis_type: string
          aoi_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          processing_time: number | null
          progress: number | null
          results: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          analysis_type: string
          aoi_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          processing_time?: number | null
          progress?: number | null
          results?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          analysis_type?: string
          aoi_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          processing_time?: number | null
          progress?: number | null
          results?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_aoi_id_fkey"
            columns: ["aoi_id"]
            isOneToOne: false
            referencedRelation: "aois"
            referencedColumns: ["id"]
          },
        ]
      }
      aois: {
        Row: {
          created_at: string | null
          geojson: Json
          id: string
          last_analysis: string | null
          metadata: Json | null
          name: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          geojson: Json
          id?: string
          last_analysis?: string | null
          metadata?: Json | null
          name: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          geojson?: Json
          id?: string
          last_analysis?: string | null
          metadata?: Json | null
          name?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aois_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_alerts: {
        Row: {
          algorithms_used: Json | null
          analysis_type: string | null
          aoi_id: string
          created_at: string | null
          data_quality_score: number | null
          detections: Json | null
          id: string
          overall_confidence: number | null
          priority_level: string | null
          processing_metadata: Json | null
          processing_time_seconds: number | null
          satellite_metadata: Json | null
          spectral_indices: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          algorithms_used?: Json | null
          analysis_type?: string | null
          aoi_id: string
          created_at?: string | null
          data_quality_score?: number | null
          detections?: Json | null
          id?: string
          overall_confidence?: number | null
          priority_level?: string | null
          processing_metadata?: Json | null
          processing_time_seconds?: number | null
          satellite_metadata?: Json | null
          spectral_indices?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          algorithms_used?: Json | null
          analysis_type?: string | null
          aoi_id?: string
          created_at?: string | null
          data_quality_score?: number | null
          detections?: Json | null
          id?: string
          overall_confidence?: number | null
          priority_level?: string | null
          processing_metadata?: Json | null
          processing_time_seconds?: number | null
          satellite_metadata?: Json | null
          spectral_indices?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_alerts_aoi_id_fkey"
            columns: ["aoi_id"]
            isOneToOne: false
            referencedRelation: "aois"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          picture: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          picture?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          picture?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          alert_id: string
          created_at: string | null
          id: string
          user_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          alert_id: string
          created_at?: string | null
          id?: string
          user_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          alert_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          vote?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "votes_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alert_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      alert_summary: {
        Row: {
          algorithms_used: Json | null
          analysis_type: string | null
          aoi_id: string | null
          aoi_name: string | null
          confidence: number | null
          created_at: string | null
          data_quality_score: number | null
          detections: Json | null
          id: string | null
          overall_confidence: number | null
          priority_level: string | null
          processing_time_seconds: number | null
          spectral_indices: Json | null
          type: Database["public"]["Enums"]["alert_type"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_aoi_id_fkey"
            columns: ["aoi_id"]
            isOneToOne: false
            referencedRelation: "aois"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aois_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_type:
        | "trash"
        | "algal_bloom"
        | "construction"
        | "vegetation_loss"
        | "vegetation_gain"
        | "deforestation"
        | "coastal_erosion"
        | "coastal_accretion"
        | "water_quality_change"
        | "urban_expansion"
        | "unknown"
      vote_type: "agree" | "dismiss"
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
      alert_type: [
        "trash",
        "algal_bloom",
        "construction",
        "vegetation_loss",
        "vegetation_gain",
        "deforestation",
        "coastal_erosion",
        "coastal_accretion",
        "water_quality_change",
        "urban_expansion",
        "unknown",
      ],
      vote_type: ["agree", "dismiss"],
    },
  },
} as const