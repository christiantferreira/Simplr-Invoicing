export interface CompanySettings {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  hasGST?: boolean;
  gstNumber?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'ready' | 'sent' | 'viewed' | 'paid' | 'overdue';
export type TemplateId = 'classic' | 'modern' | 'creative' | 'professional';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  templateId: TemplateId;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  paidAt?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  pendingInvoices: { count: number; amount: number };
  overdueInvoices: { count: number; amount: number };
  monthlyInvoices: number;
}
