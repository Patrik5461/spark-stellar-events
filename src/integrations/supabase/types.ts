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
      clothing_images: {
        Row: {
          availability: string
          category: string
          color: string
          created_at: string
          currency: string
          description: string
          featured_on_homepage: boolean
          id: string
          internal_note: string
          is_active: boolean
          material: string
          price: number | null
          price_on_request: boolean
          quantity: number
          size: string
          sort_order: number
          storage_path: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          availability?: string
          category?: string
          color?: string
          created_at?: string
          currency?: string
          description?: string
          featured_on_homepage?: boolean
          id?: string
          internal_note?: string
          is_active?: boolean
          material?: string
          price?: number | null
          price_on_request?: boolean
          quantity?: number
          size?: string
          sort_order?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
          url: string
        }
        Update: {
          availability?: string
          category?: string
          color?: string
          created_at?: string
          currency?: string
          description?: string
          featured_on_homepage?: boolean
          id?: string
          internal_note?: string
          is_active?: boolean
          material?: string
          price?: number | null
          price_on_request?: boolean
          quantity?: number
          size?: string
          sort_order?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt: string
          caption: string
          category: string
          created_at: string
          featured_on_homepage: boolean
          id: string
          is_active: boolean
          sort_order: number
          storage_path: string | null
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string
          caption?: string
          category?: string
          created_at?: string
          featured_on_homepage?: boolean
          id?: string
          is_active?: boolean
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string
          caption?: string
          category?: string
          created_at?: string
          featured_on_homepage?: boolean
          id?: string
          is_active?: boolean
          sort_order?: number
          storage_path?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      health_logs: {
        Row: {
          created_at: string
          details: Json | null
          event: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event: string
          id?: string
          status: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          event?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_text: string | null
          address: string
          billing_address: string | null
          billing_dic: string | null
          billing_iban: string | null
          billing_ic_dph: string | null
          billing_ico: string | null
          billing_name: string | null
          contact_person: string
          contact_text: string | null
          cta_primary: string | null
          cta_secondary: string | null
          email: string
          facebook_url: string | null
          footer_text: string | null
          gallery_intro: string | null
          hero_headline: string | null
          hero_subtitle: string | null
          id: number
          instagram_url: string | null
          linkedin_url: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          about_text?: string | null
          address?: string
          billing_address?: string | null
          billing_dic?: string | null
          billing_iban?: string | null
          billing_ic_dph?: string | null
          billing_ico?: string | null
          billing_name?: string | null
          contact_person?: string
          contact_text?: string | null
          cta_primary?: string | null
          cta_secondary?: string | null
          email?: string
          facebook_url?: string | null
          footer_text?: string | null
          gallery_intro?: string | null
          hero_headline?: string | null
          hero_subtitle?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string
          updated_at?: string
        }
        Update: {
          about_text?: string | null
          address?: string
          billing_address?: string | null
          billing_dic?: string | null
          billing_iban?: string | null
          billing_ic_dph?: string | null
          billing_ico?: string | null
          billing_name?: string | null
          contact_person?: string
          contact_text?: string | null
          cta_primary?: string | null
          cta_secondary?: string | null
          email?: string
          facebook_url?: string | null
          footer_text?: string | null
          gallery_intro?: string | null
          hero_headline?: string | null
          hero_subtitle?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "editor" | "user"
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
