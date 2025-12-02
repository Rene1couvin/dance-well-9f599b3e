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
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      booking_details_view: {
        Row: {
          booking_id: string | null
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_details_view_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          event_id: string
          id: string
          payment_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_id: string
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_id?: string
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollment_schedule: {
        Row: {
          created_at: string | null
          enrollment_id: string
          id: string
          selected_days: string[]
        }
        Insert: {
          created_at?: string | null
          enrollment_id: string
          id?: string
          selected_days: string[]
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string
          id?: string
          selected_days?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollment_schedule_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "class_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          payment_status: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          payment_status?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          payment_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          available_days: string[] | null
          capacity: number
          category: Database["public"]["Enums"]["class_category"]
          class_type: string | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          fixed_days: string[] | null
          id: string
          is_active: boolean | null
          location: string | null
          price: number | null
          private_price: number | null
          regular_price: number | null
          schedule: string | null
          teacher_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          available_days?: string[] | null
          capacity?: number
          category: Database["public"]["Enums"]["class_category"]
          class_type?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          fixed_days?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          price?: number | null
          private_price?: number | null
          regular_price?: number | null
          schedule?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          available_days?: string[] | null
          capacity?: number
          category?: Database["public"]["Enums"]["class_category"]
          class_type?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          fixed_days?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          price?: number | null
          private_price?: number | null
          regular_price?: number | null
          schedule?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          responded_at: string | null
          responded_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number
          class_category: Database["public"]["Enums"]["class_category"] | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          end_time: string | null
          id: string
          is_paid: boolean | null
          online_link: string | null
          payment_redirect_url: string | null
          price: number | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
          venue_address: string | null
        }
        Insert: {
          capacity?: number
          class_category?: Database["public"]["Enums"]["class_category"] | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_paid?: boolean | null
          online_link?: string | null
          payment_redirect_url?: string | null
          price?: number | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
          venue_address?: string | null
        }
        Update: {
          capacity?: number
          class_category?: Database["public"]["Enums"]["class_category"] | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_paid?: boolean | null
          online_link?: string | null
          payment_redirect_url?: string | null
          price?: number | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
          venue_address?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string | null
          id: string
          type: string
          uploaded_by: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          type: string
          uploaded_by: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          type?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_payments: {
        Row: {
          amount: number
          booking_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          enrollment_id: string | null
          id: string
          payment_method: string
          phone_number: string | null
          status: string | null
          user_id: string
          ussd_code: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          enrollment_id?: string | null
          id?: string
          payment_method: string
          phone_number?: string | null
          status?: string | null
          user_id: string
          ussd_code?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          enrollment_id?: string | null
          id?: string
          payment_method?: string
          phone_number?: string | null
          status?: string | null
          user_id?: string
          ussd_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "class_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          is_read: boolean | null
          message: string
          sent_at: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          is_read?: boolean | null
          message: string
          sent_at?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          id?: string
          is_read?: boolean | null
          message?: string
          sent_at?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          notification_preferences: Json | null
          phone: string | null
          profile_photo_url: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          id: string
          last_name: string
          notification_preferences?: Json | null
          phone?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notification_preferences?: Json | null
          phone?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      make_user_admin: { Args: { user_email: string }; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "editor" | "student"
      booking_status: "pending" | "paid" | "confirmed" | "canceled" | "refunded"
      class_category:
        | "salsa"
        | "bachata"
        | "kizomba"
        | "konpa"
        | "semba"
        | "zouk"
      payment_provider: "stripe" | "paypal"
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
      app_role: ["super_admin", "editor", "student"],
      booking_status: ["pending", "paid", "confirmed", "canceled", "refunded"],
      class_category: ["salsa", "bachata", "kizomba", "konpa", "semba", "zouk"],
      payment_provider: ["stripe", "paypal"],
    },
  },
} as const
