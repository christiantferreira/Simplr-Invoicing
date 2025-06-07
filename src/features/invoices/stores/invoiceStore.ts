import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { format, addDays, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  Client, 
  Invoice, 
  CompanySettings, 
  DashboardStats, 
  CreateClientData,
  CreateInvoiceData,
  UUID,
  InvoiceItem,
  CurrencyAmount
} from '@/types';

interface InvoiceState {
  // Data
  clients: Client[];
  invoices: Invoice[];
  companySettings: CompanySettings | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Client Actions
  setClients: (clients: Client[]) => void;
  addClient: (clientData: CreateClientData) => Promise<Client>;
  updateClient: (client: Client) => void;
  deleteClient: (id: UUID) => void;
  
  // Invoice Actions
  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoiceData: CreateInvoiceData) => Promise<Invoice>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: UUID) => void;
  
  // Company Settings Actions
  setCompanySettings: (settings: CompanySettings) => void;
  updateCompanySettings: (settings: CompanySettings) => void;
  refreshCompanySettings: () => Promise<void>;
  
  // Utility Actions
  getDashboardStats: () => DashboardStats;
  getNextInvoiceNumber: () => Promise<string>;
  calculateInvoiceTotals: (items: InvoiceItem[], discount: number, taxRate: number) => {
    subtotal: CurrencyAmount;
    taxAmount: CurrencyAmount;
    total: CurrencyAmount;
  };
}

export const useInvoiceStore = create<InvoiceState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        clients: [],
        invoices: [],
        companySettings: null,
        loading: false,
        error: null,

        // Basic Actions
        setLoading: (loading: boolean) => {
          set((state) => {
            state.loading = loading;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },

        // Client Actions
        setClients: (clients: Client[]) => {
          set((state) => {
            state.clients = clients;
          });
        },

        addClient: async (clientData: CreateClientData): Promise<Client> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          try {
            // Save client to Supabase
            const { data: clientResult, error: clientError } = await supabase
              .from('clients')
              .insert({
                user_id: user.id,
                contact_name: clientData.name,
                email: clientData.email,
                phone_number: clientData.phone || null,
                company_name: clientData.company || null,
                address: clientData.address || null,
              })
              .select()
              .single();

            if (clientError) throw clientError;

            // Create the client object for local state
            const newClient: Client = {
              id: clientResult.id,
              name: clientData.name,
              email: clientData.email,
              phone: clientData.phone || '',
              company: clientData.company || '',
              address: clientData.address || '',
              createdAt: format(new Date(), 'yyyy-MM-dd'),
            };

            set((state) => {
              state.clients.push(newClient);
            });

            return newClient;
          } catch (error) {
            console.error('Error saving client:', error);
            throw error;
          }
        },

        updateClient: (client: Client) => {
          set((state) => {
            const index = state.clients.findIndex(c => c.id === client.id);
            if (index !== -1) {
              state.clients[index] = client;
            }
          });
        },

        deleteClient: (id: UUID) => {
          set((state) => {
            state.clients = state.clients.filter(client => client.id !== id);
          });
        },

        // Invoice Actions
        setInvoices: (invoices: Invoice[]) => {
          set((state) => {
            state.invoices = invoices;
          });
        },

        addInvoice: async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const now = format(new Date(), 'yyyy-MM-dd');
          const invoiceNumber = await get().getNextInvoiceNumber();

          try {
            // Save invoice to Supabase
            const { data: invoiceResult, error: invoiceError } = await supabase
              .from('invoices')
              .insert({
                user_id: user.id,
                client_id: invoiceData.clientId,
                invoice_number: invoiceNumber,
                status: invoiceData.status,
                issue_date: invoiceData.issueDate,
                due_date: invoiceData.dueDate,
                subtotal: invoiceData.subtotal,
                discount: invoiceData.discount,
                tax: invoiceData.tax,
                total: invoiceData.total,
                notes: invoiceData.notes,
              })
              .select()
              .single();

            if (invoiceError) throw invoiceError;

            // Save invoice items to Supabase
            if (invoiceData.items && invoiceData.items.length > 0) {
              const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(
                  invoiceData.items.map(item => ({
                    invoice_id: invoiceResult.id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    total: item.total,
                  }))
                );

              if (itemsError) throw itemsError;
            }

            // Create the invoice object for local state
            const newInvoice: Invoice = {
              ...invoiceData,
              id: invoiceResult.id,
              invoiceNumber,
              createdAt: now,
              updatedAt: now,
            };

            set((state) => {
              state.invoices.push(newInvoice);
            });

            return newInvoice;
          } catch (error) {
            console.error('Error saving invoice:', error);
            throw error;
          }
        },

        updateInvoice: async (invoice: Invoice): Promise<void> => {
          try {
            const updatedInvoice = { ...invoice, updatedAt: format(new Date(), 'yyyy-MM-dd') };
            
            // Update in Supabase
            const { error } = await supabase
              .from('invoices')
              .update({
                status: updatedInvoice.status,
                issue_date: updatedInvoice.issueDate,
                due_date: updatedInvoice.dueDate,
                subtotal: updatedInvoice.subtotal,
                discount: updatedInvoice.discount,
                tax: updatedInvoice.tax,
                total: updatedInvoice.total,
                notes: updatedInvoice.notes,
                updated_at: updatedInvoice.updatedAt,
              })
              .eq('id', invoice.id);

            if (error) throw error;

            // Update local state
            set((state) => {
              const index = state.invoices.findIndex(inv => inv.id === invoice.id);
              if (index !== -1) {
                state.invoices[index] = updatedInvoice;
              }
            });
          } catch (error) {
            console.error('Error updating invoice:', error);
            throw error;
          }
        },

        deleteInvoice: (id: UUID) => {
          set((state) => {
            state.invoices = state.invoices.filter(invoice => invoice.id !== id);
          });
        },

        // Company Settings Actions
        setCompanySettings: (settings: CompanySettings) => {
          set((state) => {
            state.companySettings = settings;
          });
        },

        updateCompanySettings: (settings: CompanySettings) => {
          set((state) => {
            state.companySettings = settings;
          });
        },

        refreshCompanySettings: async (): Promise<void> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          try {
            const { data, error } = await supabase
              .from('company_info')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (error) {
              console.error('Error loading company settings:', error);
              return;
            }

            if (data && data.length > 0) {
              const companyData = data[0];
              const companySettings: CompanySettings = {
                id: companyData.id,
                name: companyData.company_name || '',
                address: companyData.address || '',
                phone: companyData.phone_number || '',
                email: companyData.email || '',
                primaryColor: companyData.primary_color || '#3B82F6',
                secondaryColor: companyData.secondary_color || '#6B7280',
                hasGST: !!companyData.gst_number,
                gstNumber: companyData.gst_number || '',
              };
              
              set((state) => {
                state.companySettings = companySettings;
              });
            }
          } catch (error) {
            console.error('Exception loading company settings:', error);
          }
        },

        // Utility Actions
        getDashboardStats: (): DashboardStats => {
          const state = get();
          const now = new Date();
          const monthStart = startOfMonth(now);
          const monthEnd = endOfMonth(now);

          const paidInvoices = state.invoices.filter(inv => inv.status === 'paid');
          const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

          const pendingInvoices = state.invoices.filter(inv => {
            const dueDate = new Date(inv.dueDate);
            const today = new Date();
            return (inv.status === 'sent' || inv.status === 'viewed') && dueDate >= today;
          });
          const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

          const overdueInvoices = state.invoices.filter(inv => {
            if (inv.status === 'paid') return false;
            const dueDate = new Date(inv.dueDate);
            const today = new Date();
            return dueDate < today;
          });
          const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

          const monthlyInvoices = state.invoices.filter(inv => {
            const invoiceDate = new Date(inv.createdAt);
            return invoiceDate >= monthStart && invoiceDate <= monthEnd;
          }).length;

          return {
            totalRevenue,
            pendingInvoices: { count: pendingInvoices.length, amount: pendingAmount },
            overdueInvoices: { count: overdueInvoices.length, amount: overdueAmount },
            monthlyInvoices,
          };
        },

        getNextInvoiceNumber: async (): Promise<string> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          try {
            // Get company settings for prefix and starting number
            const { data: companyData } = await supabase
              .from('company_info')
              .select('invoice_prefix, invoice_start_number')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const prefix = companyData?.invoice_prefix || '';
            const startNumber = companyData?.invoice_start_number || 1;

            // Get the highest invoice number for this user
            const { data: invoices } = await supabase
              .from('invoices')
              .select('invoice_number')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            let nextNumber = startNumber;

            if (invoices && invoices.length > 0) {
              // Extract numbers from existing invoice numbers
              const numbers = invoices
                .filter(inv => inv.invoice_number !== null)
                .map(inv => {
                  const numberPart = inv.invoice_number!.replace(prefix, '');
                  return parseInt(numberPart, 10);
                })
                .filter(num => !isNaN(num));

              if (numbers.length > 0) {
                nextNumber = Math.max(...numbers) + 1;
              }
            }

            return `${prefix}${String(nextNumber).padStart(3, '0')}`;
          } catch (error) {
            console.error('Error generating invoice number:', error);
            // Fallback to timestamp-based number
            return `${Date.now()}`;
          }
        },

        calculateInvoiceTotals: (items: InvoiceItem[], discount: number = 0, taxRate: number = 0) => {
          const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
          const discountAmount = subtotal * (discount / 100);
          const taxableAmount = subtotal - discountAmount;
          const taxAmount = taxableAmount * (taxRate / 100);
          const total = taxableAmount + taxAmount;

          return {
            subtotal,
            taxAmount,
            total
          };
        },
      })),
      {
        name: 'invoice-store',
        partialize: (state) => ({
          companySettings: state.companySettings,
        }),
      }
    ),
    {
      name: 'invoice-store',
    }
  )
);

// Selectors for better performance
export const useClients = () => useInvoiceStore((state) => state.clients);
export const useInvoices = () => useInvoiceStore((state) => state.invoices);
export const useCompanySettings = () => useInvoiceStore((state) => state.companySettings);
export const useInvoiceLoading = () => useInvoiceStore((state) => state.loading);
export const useInvoiceError = () => useInvoiceStore((state) => state.error);
