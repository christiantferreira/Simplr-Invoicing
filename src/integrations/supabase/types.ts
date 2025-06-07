export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          gst_number: string | null
          id: string
          notes: string | null
          phone_number: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          notes?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          notes?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      company_info: {
        Row: {
          address: string | null
          address_extra_type: string | null
          address_extra_value: string | null
          business_legal_name: string
          business_number: string | null
          city: string
          company_name: string | null
          county: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          invoice_prefix: string | null
          invoice_start_number: number | null
          is_service_provider: boolean
          phone_number: string | null
          postal_code: string
          primary_color: string | null
          province: string
          secondary_color: string | null
          service_area: string | null
          service_type: string | null
          street_name: string
          street_number: string
          trade_name: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          address_extra_type?: string | null
          address_extra_value?: string | null
          business_legal_name: string
          business_number?: string | null
          city: string
          company_name?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          invoice_prefix?: string | null
          invoice_start_number?: number | null
          is_service_provider?: boolean
          phone_number?: string | null
          postal_code: string
          primary_color?: string | null
          province: string
          secondary_color?: string | null
          service_area?: string | null
          service_type?: string | null
          street_name: string
          street_number: string
          trade_name?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          address_extra_type?: string | null
          address_extra_value?: string | null
          business_legal_name?: string
          business_number?: string | null
          city?: string
          company_name?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          invoice_prefix?: string | null
          invoice_start_number?: number | null
          is_service_provider?: boolean
          phone_number?: string | null
          postal_code?: string
          primary_color?: string | null
          province?: string
          secondary_color?: string | null
          service_area?: string | null
          service_type?: string | null
          street_name?: string
          street_number?: string
          trade_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          quantity: number | null
          tax_amount: number | null
          tax_rate: number | null
          tax_type: string | null
          total: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          quantity?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          total?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          quantity?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          total?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          discount: number | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          notes: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          tax_rate: number | null
          tax_type: string | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      other_service_types_log: {
        Row: {
          created_at: string | null
          entered_service: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entered_service: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entered_service?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "other_service_types_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tax_configurations: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          province_code: string
          tax_name: string
          tax_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          province_code: string
          tax_name: string
          tax_rate: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          province_code?: string
          tax_name?: string
          tax_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          role?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
