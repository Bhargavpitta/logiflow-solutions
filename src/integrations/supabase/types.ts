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
      agencies: {
        Row: {
          agency_name: string
          alt_number: string | null
          created_at: string
          id: string
          organizer_name: string | null
          organizer_number: string | null
          updated_at: string
        }
        Insert: {
          agency_name: string
          alt_number?: string | null
          created_at?: string
          id?: string
          organizer_name?: string | null
          organizer_number?: string | null
          updated_at?: string
        }
        Update: {
          agency_name?: string
          alt_number?: string | null
          created_at?: string
          id?: string
          organizer_name?: string | null
          organizer_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_management_companies: {
        Row: {
          alt_mobile: string | null
          company_name: string
          created_at: string
          email: string | null
          id: string
          mobile: string | null
          organizer_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          alt_mobile?: string | null
          company_name: string
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          organizer_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          alt_mobile?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          organizer_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_vehicles: {
        Row: {
          created_at: string
          day_date: string
          end_time: string | null
          event_id: string
          id: string
          start_time: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          day_date: string
          end_time?: string | null
          event_id: string
          id?: string
          start_time?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          day_date?: string
          end_time?: string | null
          event_id?: string
          id?: string
          start_time?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_vehicles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          from_date: string
          id: string
          name: string
          organizer_name: string | null
          organizer_number: string | null
          status: string
          to_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_date: string
          id?: string
          name: string
          organizer_name?: string | null
          organizer_number?: string | null
          status?: string
          to_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_date?: string
          id?: string
          name?: string
          organizer_name?: string | null
          organizer_number?: string | null
          status?: string
          to_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      logistics_entries: {
        Row: {
          closing_meter: number
          closing_time: string
          contact_number: string | null
          created_at: string
          driver_name: string
          extra_hours: number
          extra_km: number
          id: string
          logistics_date: string
          ownership_id: number
          package_hours_id: number
          starting_meter: number
          starting_time: string
          total_amount: number
          total_hours: number
          total_km: number
          updated_at: string
          user_id: string
          vehicle_model: string
          vehicle_number: string
          vehicle_type_id: number
        }
        Insert: {
          closing_meter: number
          closing_time: string
          contact_number?: string | null
          created_at?: string
          driver_name: string
          extra_hours?: number
          extra_km?: number
          id?: string
          logistics_date: string
          ownership_id: number
          package_hours_id: number
          starting_meter: number
          starting_time: string
          total_amount?: number
          total_hours?: number
          total_km?: number
          updated_at?: string
          user_id: string
          vehicle_model?: string
          vehicle_number: string
          vehicle_type_id?: number
        }
        Update: {
          closing_meter?: number
          closing_time?: string
          contact_number?: string | null
          created_at?: string
          driver_name?: string
          extra_hours?: number
          extra_km?: number
          id?: string
          logistics_date?: string
          ownership_id?: number
          package_hours_id?: number
          starting_meter?: number
          starting_time?: string
          total_amount?: number
          total_hours?: number
          total_km?: number
          updated_at?: string
          user_id?: string
          vehicle_model?: string
          vehicle_number?: string
          vehicle_type_id?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          agency_id: string | null
          created_at: string
          id: string
          owner_name: string
          owner_number: string | null
          ownership: string
          status: string
          updated_at: string
          vehicle_model: string
          vehicle_name: string
          vehicle_number: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          id?: string
          owner_name: string
          owner_number?: string | null
          ownership: string
          status?: string
          updated_at?: string
          vehicle_model?: string
          vehicle_name?: string
          vehicle_number: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          id?: string
          owner_name?: string
          owner_number?: string | null
          ownership?: string
          status?: string
          updated_at?: string
          vehicle_model?: string
          vehicle_name?: string
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
