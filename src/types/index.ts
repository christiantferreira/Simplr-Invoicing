// Base types
export type UUID = string;
export type DateString = string; // ISO date string
export type CurrencyAmount = number;
export type EmailAddress = string;
export type PhoneNumber = string;
export type HexColor = string;

// Company Settings
export interface CompanySettings {
  id: UUID;
  name: string;
  address?: string;
  phone?: PhoneNumber;
  email?: EmailAddress;
  logo?: string;
  primaryColor: HexColor;
  secondaryColor: HexColor;
  hasGST?: boolean;
  gstNumber?: string;
}

// Client Management
export interface Client {
  id: UUID;
  name: string;
  email: EmailAddress;
  phone?: PhoneNumber;
  address?: string;
  company?: string;
  createdAt: DateString;
}

export interface CreateClientData {
  name: string;
  email: EmailAddress;
  phone?: PhoneNumber;
  address?: string;
  company?: string;
  hasGST?: boolean;
  gstNumber?: string;
}

// Invoice Items
export interface InvoiceItem {
  id: UUID;
  description: string;
  quantity: number;
  unitPrice: CurrencyAmount;
  total: CurrencyAmount;
}

export interface CreateInvoiceItemData {
  description: string;
  quantity: number;
  unitPrice: CurrencyAmount;
}

// Invoice Status and Templates
export type InvoiceStatus = 'draft' | 'ready' | 'sent' | 'viewed' | 'paid' | 'overdue';
export type TemplateId = 'classic' | 'modern' | 'creative' | 'professional';

// Invoice Management
export interface Invoice {
  id: UUID;
  invoiceNumber: string;
  clientId: UUID;
  status: InvoiceStatus;
  issueDate: DateString;
  dueDate: DateString;
  items: InvoiceItem[];
  subtotal: CurrencyAmount;
  discount: CurrencyAmount;
  tax: CurrencyAmount;
  total: CurrencyAmount;
  notes?: string;
  templateId: TemplateId;
  createdAt: DateString;
  updatedAt: DateString;
  sentAt?: DateString;
  paidAt?: DateString;
}

export interface CreateInvoiceData {
  clientId: UUID;
  status: InvoiceStatus;
  issueDate: DateString;
  dueDate: DateString;
  items: InvoiceItem[];
  subtotal: CurrencyAmount;
  discount: CurrencyAmount;
  tax: CurrencyAmount;
  total: CurrencyAmount;
  notes?: string;
  templateId: TemplateId;
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
  userId: UUID;
  provinceCode: string;
  taxName: string;
  taxRate: number;
  isEnabled: boolean;
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
  clientId: string;
  status: InvoiceStatus;
  issueDate: DateString;
  dueDate: DateString;
  items: InvoiceItem[];
  subtotal: CurrencyAmount;
  discount: CurrencyAmount;
  tax: CurrencyAmount;
  total: CurrencyAmount;
  notes?: string;
  templateId: TemplateId;
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
