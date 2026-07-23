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
      contract_templates: {
        Row: {
          contract_type: Database["public"]["Enums"]["hostess_contract_type"]
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          mime_type: string | null
          name: string
          original_filename: string | null
          placeholder_mapping: Json
          storage_path: string
          updated_at: string
        }
        Insert: {
          contract_type: Database["public"]["Enums"]["hostess_contract_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          mime_type?: string | null
          name: string
          original_filename?: string | null
          placeholder_mapping?: Json
          storage_path: string
          updated_at?: string
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["hostess_contract_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          mime_type?: string | null
          name?: string
          original_filename?: string | null
          placeholder_mapping?: Json
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_assignments: {
        Row: {
          admin_note: string | null
          agreed_payment: number | null
          arrival_time: string | null
          attendance_status: Database["public"]["Enums"]["event_attendance_status"]
          break_minutes: number
          contract_required: boolean
          contract_signed: boolean
          created_at: string
          departure_time: string | null
          event_id: string
          generated_contract_id: string | null
          hostess_profile_id: string
          id: string
          paid: boolean
          paid_at: string | null
          payment_amount_calculated: number | null
          payment_amount_final: number | null
          payment_note: string | null
          payment_type: Database["public"]["Enums"]["event_payment_type"] | null
          status: Database["public"]["Enums"]["event_assignment_status"]
          updated_at: string
          worked_hours: number | null
          worker_note: string | null
        }
        Insert: {
          admin_note?: string | null
          agreed_payment?: number | null
          arrival_time?: string | null
          attendance_status?: Database["public"]["Enums"]["event_attendance_status"]
          break_minutes?: number
          contract_required?: boolean
          contract_signed?: boolean
          created_at?: string
          departure_time?: string | null
          event_id: string
          generated_contract_id?: string | null
          hostess_profile_id: string
          id?: string
          paid?: boolean
          paid_at?: string | null
          payment_amount_calculated?: number | null
          payment_amount_final?: number | null
          payment_note?: string | null
          payment_type?:
            | Database["public"]["Enums"]["event_payment_type"]
            | null
          status?: Database["public"]["Enums"]["event_assignment_status"]
          updated_at?: string
          worked_hours?: number | null
          worker_note?: string | null
        }
        Update: {
          admin_note?: string | null
          agreed_payment?: number | null
          arrival_time?: string | null
          attendance_status?: Database["public"]["Enums"]["event_attendance_status"]
          break_minutes?: number
          contract_required?: boolean
          contract_signed?: boolean
          created_at?: string
          departure_time?: string | null
          event_id?: string
          generated_contract_id?: string | null
          hostess_profile_id?: string
          id?: string
          paid?: boolean
          paid_at?: string | null
          payment_amount_calculated?: number | null
          payment_amount_final?: number | null
          payment_note?: string | null
          payment_type?:
            | Database["public"]["Enums"]["event_payment_type"]
            | null
          status?: Database["public"]["Enums"]["event_assignment_status"]
          updated_at?: string
          worked_hours?: number | null
          worker_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_generated_contract_id_fkey"
            columns: ["generated_contract_id"]
            isOneToOne: false
            referencedRelation: "generated_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_hostess_profile_id_fkey"
            columns: ["hostess_profile_id"]
            isOneToOne: false
            referencedRelation: "hostess_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json | null
          event_id: string
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          event_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_clients: {
        Row: {
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          note: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          note?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          note?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_documents: {
        Row: {
          created_at: string
          document_type: string
          event_id: string
          file_name: string
          file_size: number | null
          generated_contract_id: string | null
          id: string
          internal_note: string | null
          mime_type: string | null
          storage_path: string
          title: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          event_id: string
          file_name: string
          file_size?: number | null
          generated_contract_id?: string | null
          id?: string
          internal_note?: string | null
          mime_type?: string | null
          storage_path: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          event_id?: string
          file_name?: string
          file_size?: number | null
          generated_contract_id?: string | null
          id?: string
          internal_note?: string | null
          mime_type?: string | null
          storage_path?: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_documents_generated_contract_id_fkey"
            columns: ["generated_contract_id"]
            isOneToOne: false
            referencedRelation: "generated_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_notes: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          event_id: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          event_id: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          event_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_notes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          client_contact_name: string | null
          client_email: string | null
          client_id: string | null
          client_phone: string | null
          clothing_instructions: string | null
          created_at: string
          created_by: string | null
          date_from: string
          date_to: string
          dress_code: string | null
          id: string
          internal_note: string | null
          job_description: string | null
          location: string
          name: string
          payment_amount: number | null
          payment_type: Database["public"]["Enums"]["event_payment_type"]
          public_note: string | null
          required_languages: string | null
          required_workers: number
          requirements: string | null
          requires_car: boolean
          requires_driver_license: boolean
          requires_food_certificate: boolean
          status: Database["public"]["Enums"]["event_status"]
          time_from: string | null
          time_to: string | null
          updated_at: string
          worker_type: Database["public"]["Enums"]["event_worker_type"]
        }
        Insert: {
          client_contact_name?: string | null
          client_email?: string | null
          client_id?: string | null
          client_phone?: string | null
          clothing_instructions?: string | null
          created_at?: string
          created_by?: string | null
          date_from: string
          date_to: string
          dress_code?: string | null
          id?: string
          internal_note?: string | null
          job_description?: string | null
          location: string
          name: string
          payment_amount?: number | null
          payment_type?: Database["public"]["Enums"]["event_payment_type"]
          public_note?: string | null
          required_languages?: string | null
          required_workers?: number
          requirements?: string | null
          requires_car?: boolean
          requires_driver_license?: boolean
          requires_food_certificate?: boolean
          status?: Database["public"]["Enums"]["event_status"]
          time_from?: string | null
          time_to?: string | null
          updated_at?: string
          worker_type?: Database["public"]["Enums"]["event_worker_type"]
        }
        Update: {
          client_contact_name?: string | null
          client_email?: string | null
          client_id?: string | null
          client_phone?: string | null
          clothing_instructions?: string | null
          created_at?: string
          created_by?: string | null
          date_from?: string
          date_to?: string
          dress_code?: string | null
          id?: string
          internal_note?: string | null
          job_description?: string | null
          location?: string
          name?: string
          payment_amount?: number | null
          payment_type?: Database["public"]["Enums"]["event_payment_type"]
          public_note?: string | null
          required_languages?: string | null
          required_workers?: number
          requirements?: string | null
          requires_car?: boolean
          requires_driver_license?: boolean
          requires_food_certificate?: boolean
          status?: Database["public"]["Enums"]["event_status"]
          time_from?: string | null
          time_to?: string | null
          updated_at?: string
          worker_type?: Database["public"]["Enums"]["event_worker_type"]
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "event_clients"
            referencedColumns: ["id"]
          },
        ]
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
      generated_contracts: {
        Row: {
          contract_type: string
          created_at: string
          docx_path: string
          event_assignment_id: string | null
          event_data: Json
          event_id: string | null
          generated_by: string | null
          generated_by_email: string | null
          hostess_id: string
          hostess_snapshot: Json
          id: string
          template_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          contract_type: string
          created_at?: string
          docx_path: string
          event_assignment_id?: string | null
          event_data?: Json
          event_id?: string | null
          generated_by?: string | null
          generated_by_email?: string | null
          hostess_id: string
          hostess_snapshot?: Json
          id?: string
          template_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          contract_type?: string
          created_at?: string
          docx_path?: string
          event_assignment_id?: string | null
          event_data?: Json
          event_id?: string | null
          generated_by?: string | null
          generated_by_email?: string | null
          hostess_id?: string
          hostess_snapshot?: Json
          id?: string
          template_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_contracts_event_assignment_id_fkey"
            columns: ["event_assignment_id"]
            isOneToOne: false
            referencedRelation: "event_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_contracts_hostess_id_fkey"
            columns: ["hostess_id"]
            isOneToOne: false
            referencedRelation: "hostess_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
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
      hostess_admin_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          meta: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      hostess_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          consent_type: Database["public"]["Enums"]["hostess_consent_type"]
          consent_version: string
          created_at: string
          hostess_profile_id: string
          id: string
          ip_address: string | null
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type: Database["public"]["Enums"]["hostess_consent_type"]
          consent_version?: string
          created_at?: string
          hostess_profile_id: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          consent_type?: Database["public"]["Enums"]["hostess_consent_type"]
          consent_version?: string
          created_at?: string
          hostess_profile_id?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostess_consents_hostess_profile_id_fkey"
            columns: ["hostess_profile_id"]
            isOneToOne: false
            referencedRelation: "hostess_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hostess_photos: {
        Row: {
          created_at: string
          file_size: number | null
          hostess_profile_id: string
          id: string
          mime_type: string | null
          original_filename: string | null
          photo_type: Database["public"]["Enums"]["hostess_photo_type"]
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          hostess_profile_id: string
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          photo_type: Database["public"]["Enums"]["hostess_photo_type"]
          storage_path: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          hostess_profile_id?: string
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          photo_type?: Database["public"]["Enums"]["hostess_photo_type"]
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostess_photos_hostess_profile_id_fkey"
            columns: ["hostess_profile_id"]
            isOneToOne: false
            referencedRelation: "hostess_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hostess_profiles: {
        Row: {
          address: string | null
          application_code: string
          availability: string | null
          birth_date: string | null
          birth_place: string | null
          city: string | null
          clothing_size: string | null
          contract_type: Database["public"]["Enums"]["hostess_contract_type"]
          created_at: string
          email: string | null
          experience: string | null
          first_name: string
          hair_color: string | null
          health_insurance: string | null
          health_restrictions: string | null
          height: string | null
          iban: string | null
          id: string
          identity_card_number: string | null
          internal_note: string | null
          invite_id: string | null
          languages: string | null
          last_name: string
          marital_status: string | null
          national_id: string | null
          nationality: string | null
          note: string | null
          pension_type: string | null
          phone: string | null
          postal_code: string | null
          shoe_size: string | null
          status: Database["public"]["Enums"]["hostess_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          application_code?: string
          availability?: string | null
          birth_date?: string | null
          birth_place?: string | null
          city?: string | null
          clothing_size?: string | null
          contract_type?: Database["public"]["Enums"]["hostess_contract_type"]
          created_at?: string
          email?: string | null
          experience?: string | null
          first_name: string
          hair_color?: string | null
          health_insurance?: string | null
          health_restrictions?: string | null
          height?: string | null
          iban?: string | null
          id?: string
          identity_card_number?: string | null
          internal_note?: string | null
          invite_id?: string | null
          languages?: string | null
          last_name: string
          marital_status?: string | null
          national_id?: string | null
          nationality?: string | null
          note?: string | null
          pension_type?: string | null
          phone?: string | null
          postal_code?: string | null
          shoe_size?: string | null
          status?: Database["public"]["Enums"]["hostess_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          application_code?: string
          availability?: string | null
          birth_date?: string | null
          birth_place?: string | null
          city?: string | null
          clothing_size?: string | null
          contract_type?: Database["public"]["Enums"]["hostess_contract_type"]
          created_at?: string
          email?: string | null
          experience?: string | null
          first_name?: string
          hair_color?: string | null
          health_insurance?: string | null
          health_restrictions?: string | null
          height?: string | null
          iban?: string | null
          id?: string
          identity_card_number?: string | null
          internal_note?: string | null
          invite_id?: string | null
          languages?: string | null
          last_name?: string
          marital_status?: string | null
          national_id?: string | null
          nationality?: string | null
          note?: string | null
          pension_type?: string | null
          phone?: string | null
          postal_code?: string | null
          shoe_size?: string | null
          status?: Database["public"]["Enums"]["hostess_status"]
          updated_at?: string
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
          detail_content: string
          icon: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          detail_content?: string
          icon?: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          detail_content?: string
          icon?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_image_path: string | null
          about_image_url: string | null
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
          hero_image_path: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          id: number
          instagram_url: string | null
          linkedin_url: string | null
          partners: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          about_image_path?: string | null
          about_image_url?: string | null
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
          hero_image_path?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          partners?: string | null
          phone?: string
          updated_at?: string
        }
        Update: {
          about_image_path?: string | null
          about_image_url?: string | null
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
          hero_image_path?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          partners?: string | null
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
      event_assignment_status:
        | "navrhnuta"
        | "kontaktovana"
        | "potvrdena"
        | "odmietnutna"
        | "nahradnicka"
        | "zucastnila_sa"
        | "neprisla"
        | "zrusena"
      event_attendance_status:
        | "nevyplnene"
        | "ok"
        | "meskala"
        | "odisla_skor"
        | "neprisla"
        | "ospravedlnena"
      event_payment_type:
        | "za_hodinu"
        | "za_den"
        | "jednorazova"
        | "na_vyziadanie"
      event_status:
        | "koncept"
        | "otvoreny_nabor"
        | "obsadene"
        | "prebieha"
        | "dokoncene"
        | "zrusene"
      event_worker_type:
        | "hosteska"
        | "promoter"
        | "helper"
        | "produkcia"
        | "ine"
      hostess_consent_type:
        | "osobne_udaje"
        | "pravdivost"
        | "fotografie"
        | "elektronicke_dokumenty"
      hostess_contract_type:
        | "prikazna_zmluva"
        | "dohoda_o_vykonani_prace"
        | "bez_zmluvy"
        | "nepriradene"
        | "brigada_bez_zmluvy"
        | "dohoda_o_brigadnickej_praci_studentov"
      hostess_photo_type: "portret" | "cela_postava" | "profil" | "dalsia"
      hostess_status:
        | "nova"
        | "skontrolovana"
        | "schvalena"
        | "zamietnuta"
        | "zmluva_pripravena"
        | "zmluva_podpisana"
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
      event_assignment_status: [
        "navrhnuta",
        "kontaktovana",
        "potvrdena",
        "odmietnutna",
        "nahradnicka",
        "zucastnila_sa",
        "neprisla",
        "zrusena",
      ],
      event_attendance_status: [
        "nevyplnene",
        "ok",
        "meskala",
        "odisla_skor",
        "neprisla",
        "ospravedlnena",
      ],
      event_payment_type: [
        "za_hodinu",
        "za_den",
        "jednorazova",
        "na_vyziadanie",
      ],
      event_status: [
        "koncept",
        "otvoreny_nabor",
        "obsadene",
        "prebieha",
        "dokoncene",
        "zrusene",
      ],
      event_worker_type: ["hosteska", "promoter", "helper", "produkcia", "ine"],
      hostess_consent_type: [
        "osobne_udaje",
        "pravdivost",
        "fotografie",
        "elektronicke_dokumenty",
      ],
      hostess_contract_type: [
        "prikazna_zmluva",
        "dohoda_o_vykonani_prace",
        "bez_zmluvy",
        "nepriradene",
        "brigada_bez_zmluvy",
        "dohoda_o_brigadnickej_praci_studentov",
      ],
      hostess_photo_type: ["portret", "cela_postava", "profil", "dalsia"],
      hostess_status: [
        "nova",
        "skontrolovana",
        "schvalena",
        "zamietnuta",
        "zmluva_pripravena",
        "zmluva_podpisana",
      ],
    },
  },
} as const
