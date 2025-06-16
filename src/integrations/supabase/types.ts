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
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          company: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string
          invoice_number: string
          status: string
          issue_date: string
          due_date: string | null
          subtotal: number
          discount: number | null
          tax: number | null
          total: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          invoice_number: string
          status?: string
          issue_date: string
          due_date?: string | null
          subtotal: number
          discount?: number | null
          tax?: number | null
          total: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          invoice_number?: string
          status?: string
          issue_date?: string
          due_date?: string | null
          subtotal?: number
          discount?: number | null
          tax?: number | null
          total?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          }
        ]
      }
      reports_cache: {
        Row: {
          id: string
          user_id: string
          report_name: string
          parameters: Json | null
          data: Json | null
          generated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          report_name: string
          parameters?: Json | null
          data?: Json | null
          generated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          report_name?: string
          parameters?: Json | null
          data?: Json | null
          generated_at?: string
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invoice_status_overview: {
        Args: {
          user_id_param: string
        }
        Returns: {
          status: string
          total_invoices: number
          total_amount: number
        }[]
      }
      get_revenue_by_period: {
        Args: {
          start_date: string
          end_date: string
          user_id_param: string
        }
        Returns: {
          total_revenue: number
          total_tax: number
          total_discount: number
          total_invoices: number
        }[]
      }
      get_client_performance: {
        Args: {
          start_date: string
          end_date: string
          user_id_param: string
        }
        Returns: {
          client_id: string
          client_name: string
          total_revenue: number
          total_invoices: number
        }[]
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
