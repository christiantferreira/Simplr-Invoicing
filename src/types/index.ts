// Base types
export type UUID = string;
export type DateString = string; // ISO date string
export type CurrencyAmount = number;
export type EmailAddress = string;
export type PhoneNumber = string;
export type HexColor = string;

// Company Settings - Aligned with 'settings' table
export interface CompanySettings {
  id: UUID;
  user_id: UUID;
  business_legal_name: string;
  trade_name?: string;
  province: string;
  city: string;
  address_extra_type?: string;
  address_extra_value?: string;
  street_number: string;
  street_name: string;
  county?: string;
  postal_code: string;
  is_service_provider: boolean;
  service_area?: string;
  service_type?: string;
  gst_number?: string;
  business_number?: string;
  has_completed_setup: boolean;
  created_at: DateString;
  updated_at: DateString;
  // These fields are not in the settings table and should be managed elsewhere
  primary_color?: HexColor; 
  secondary_color?: HexColor;
}

// Client Management
export interface Client {
  id: UUID;
  user_id: UUID;
  name: string;
  email: EmailAddress;
  phone?: PhoneNumber;
  address?: string;
  company?: string;
  province?: string;
  city?: string;
  address_extra_type?: string;
  address_extra_value?: string;
  street_number?: string;
  street_name?: string;
  county?: string;
  postal_code?: string;
  created_at: DateString;
}

export interface CreateClientData {
  name: string;
  email: EmailAddress;
  phone?: PhoneNumber;
  company?: string;
  province?: string;
  city?: string;
  address_extra_type?: string;
  address_extra_value?: string;
  street_number?: string;
  street_name?: string;
  county?: string;
  postal_code?: string;
}

// Invoice Items
export interface InvoiceItem {
  id: UUID;
  invoice_id: UUID;
  description: string;
  quantity: number;
  unit_price: CurrencyAmount;
  total: CurrencyAmount;
  tax_rate?: number;
  tax_amount?: CurrencyAmount;
  tax_name?: string;
  tax_value?: string; // Stores the select value for easier mapping
}

export interface CreateInvoiceItemData {
  description: string;
  quantity: number;
  unit_price: CurrencyAmount;
}

// Invoice Status and Templates
export type InvoiceStatus = 'draft' | 'ready' | 'sent' | 'viewed' | 'paid' | 'overdue';
export type TemplateId = 'classic' | 'modern' | 'creative' | 'professional';

// Invoice Management
export interface Invoice {
  id: UUID;
  user_id: UUID;
  client_id: UUID;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: DateString;
  due_date: DateString;
  items?: InvoiceItem[];
  subtotal: CurrencyAmount;
  discount: CurrencyAmount;
  discount_type?: 'amount' | 'percentage';
  tax: CurrencyAmount;
  total: CurrencyAmount;
  notes?: string;
  created_at: DateString;
  updated_at: DateString;
  sent_at?: DateString;
  paid_at?: DateString;
}

export interface CreateInvoiceData {
  client_id: UUID;
  status: InvoiceStatus;
  issue_date: DateString;
  due_date: DateString;
  items: InvoiceItem[];
  subtotal: CurrencyAmount;
  discount: CurrencyAmount;
  discount_type?: 'amount' | 'percentage';
  tax: CurrencyAmount;
  total: CurrencyAmount;
  notes?: string;
}

// Dashboard and Statistics
export interface DashboardStats {
  totalRevenue: CurrencyAmount;
  pendingInvoices: { count: number; amount: CurrencyAmount };
  overdueInvoices: { count: number; amount: CurrencyAmount };
  monthlyInvoices: number;
}

// Tax Configuration
export interface TaxConfiguration {
  id: UUID;
  user_id: UUID;
  province: string; // Corrected from province_code
  tax_name: string;
  tax_rate: number;
  is_enabled: boolean;
}

export interface TaxOption {
  value: string;
  label: string;
  rate: number;
  name: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface InvoiceFormData {
  client_id: string;
  status: InvoiceStatus;
  issue_date: DateString;
  due_date: DateString;
  items: InvoiceItem[];
  subtotal: CurrencyAmount;
  discount: CurrencyAmount;
  discount_type?: 'amount' | 'percentage';
  tax: CurrencyAmount;
  total: CurrencyAmount;
  notes?: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Utility Types
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
