
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Client, Invoice, CompanySettings, DashboardStats, CreateClientData } from '@/types';
import { format, addDays, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { useSupabaseInvoices } from '../hooks/useSupabaseInvoices';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InvoiceState {
  clients: Client[];
  invoices: Invoice[];
  companySettings: CompanySettings | null;
  loading: boolean;
}

type InvoiceAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'SET_COMPANY_SETTINGS'; payload: CompanySettings };

const initialState: InvoiceState = {
  clients: [],
  invoices: [],
  companySettings: null,
  loading: true,
};

const invoiceReducer = (state: InvoiceState, action: InvoiceAction): InvoiceState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id ? action.payload : client
        ),
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload),
      };
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id ? action.payload : invoice
        ),
      };
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(invoice => invoice.id !== action.payload),
      };
    case 'SET_COMPANY_SETTINGS':
      return { ...state, companySettings: action.payload };
    default:
      return state;
  }
};

interface InvoiceContextType {
  state: InvoiceState;
  addClient: (client: CreateClientData) => Promise<Client>;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => void;
  updateCompanySettings: (settings: CompanySettings) => void;
  refreshCompanySettings: () => Promise<void>;
  getDashboardStats: () => DashboardStats;
  getNextInvoiceNumber: () => Promise<string>;
  calculateInvoiceTotals: (items: any[], discount: number, taxRate: number) => { subtotal: number; taxAmount: number; total: number };
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);
  const { clients, invoices, loading, getNextInvoiceNumber, updateInvoice: updateInvoiceInSupabase } = useSupabaseInvoices();
  const { user } = useAuth();

  const buildAddress = (settings: Record<string, unknown>): string | null => {
    const parts = [
      settings.street_number,
      settings.street_name,
      settings.address_extra_value ? `${settings.address_extra_type} ${settings.address_extra_value}` : null,
      settings.city,
      settings.province,
      settings.postal_code
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const loadCompanySettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (error) {
        // It's okay if no settings are found yet (PGRST116: "Not a single row was found")
        if (error.code !== 'PGRST116') {
          console.error('Error loading company settings:', error);
        }
        return;
      }

      if (data) {
        // Map settings table fields to CompanySettings interface
        const mappedSettings: CompanySettings = {
          ...data,
          // Map company name fields
          name: data.business_legal_name || data.company_name || "Company Name Not Set",
          // Build address from separate fields
          address: buildAddress(data) || "Company Address Not Set",
          // Map phone field
          phone: data.phone_number || "Phone Number Not Set",
          // Use settings email or fallback to user email
          email: data.email || user.email || "Email Not Set",
          // Map GST field
          gstNumber: data.gst_number,
          hasGST: !!data.gst_number,
        };

        dispatch({ type: 'SET_COMPANY_SETTINGS', payload: mappedSettings });
      }
    } catch (error) {
      console.error('Exception loading company settings:', error);
    }
  };

  // Load company settings on user change
  useEffect(() => {
    loadCompanySettings();
  }, [user]);

  // Update state when Supabase data changes
  useEffect(() => {
    dispatch({ type: 'SET_CLIENTS', payload: clients });
  }, [clients]);

  useEffect(() => {
    dispatch({ type: 'SET_INVOICES', payload: invoices });
  }, [invoices]);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [loading]);

  const calculateInvoiceTotals = (items: any[], discount: number = 0, taxRate: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      taxAmount,
      total
    };
  };

  const addClient = async (clientData: CreateClientData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Save client to Supabase using the correct field names
      const { data: clientResult, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone || null,
          company: clientData.company || null,
          province: clientData.province || null,
          city: clientData.city || null,
          address_extra_type: clientData.address_extra_type || null,
          address_extra_value: clientData.address_extra_value || null,
          street_number: clientData.street_number || null,
          street_name: clientData.street_name || null,
          county: clientData.county || null,
          postal_code: clientData.postal_code || null,
          // Keep legacy address field for backward compatibility
          address: clientData.address || null,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create the client object for local state
      const newClient: Client = {
        id: clientResult.id,
        user_id: user.id,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone || '',
        company: clientData.company || '',
        province: clientData.province || '',
        city: clientData.city || '',
        address_extra_type: clientData.address_extra_type || '',
        address_extra_value: clientData.address_extra_value || '',
        street_number: clientData.street_number || '',
        street_name: clientData.street_name || '',
        county: clientData.county || '',
        postal_code: clientData.postal_code || '',
        address: clientData.address || '',
        created_at: format(new Date(), 'yyyy-MM-dd'),
      };

      dispatch({ type: 'ADD_CLIENT', payload: newClient });
      return newClient;
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  };

  const updateClient = (client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
  };

  const deleteClient = (id: string) => {
    dispatch({ type: 'DELETE_CLIENT', payload: id });
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const now = format(new Date(), 'yyyy-MM-dd');
    const invoiceNumber = await getNextInvoiceNumber();

    try {
      // Save invoice to Supabase
      const { data: invoiceResult, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: invoiceData.client_id,
          invoice_number: invoiceNumber,
          status: invoiceData.status,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
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
              unit_price: item.unit_price,
              total: item.total,
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Create the invoice object for local state
      const newInvoice: Invoice = {
        ...invoiceData,
        id: invoiceResult.id,
        user_id: user.id,
        invoice_number: invoiceNumber,
        created_at: now,
        updated_at: now,
      };

      dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
      return newInvoice;
    } catch (error) {
      console.error('Error saving invoice:', error);
      throw error;
    }
  };

  const updateInvoice = async (invoice: Invoice) => {
    try {
      const updatedInvoice = { ...invoice, updatedAt: format(new Date(), 'yyyy-MM-dd') };
      await updateInvoiceInSupabase(updatedInvoice);
      // The state will be updated automatically when useSupabaseInvoices reloads the data
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  const deleteInvoice = (id: string) => {
    dispatch({ type: 'DELETE_INVOICE', payload: id });
  };

  const updateCompanySettings = (settings: CompanySettings) => {
    dispatch({ type: 'SET_COMPANY_SETTINGS', payload: settings });
  };

  const refreshCompanySettings = async () => {
    await loadCompanySettings();
  };

  const getDashboardStats = (): DashboardStats => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const paidInvoices = state.invoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const pendingInvoices = state.invoices.filter(inv => {
      const dueDate = new Date(inv.due_date);
      const today = new Date();
      return (inv.status === 'sent' || inv.status === 'viewed') && dueDate >= today;
    });
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const overdueInvoices = state.invoices.filter(inv => {
      if (inv.status === 'paid') return false;
      const dueDate = new Date(inv.due_date);
      const today = new Date();
      return dueDate < today;
    });
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const monthlyInvoices = state.invoices.filter(inv => {
      const invoiceDate = new Date(inv.created_at);
      return invoiceDate >= monthStart && invoiceDate <= monthEnd;
    }).length;

    return {
      totalRevenue,
      pendingInvoices: { count: pendingInvoices.length, amount: pendingAmount },
      overdueInvoices: { count: overdueInvoices.length, amount: overdueAmount },
      monthlyInvoices,
    };
  };

  return (
    <InvoiceContext.Provider
      value={{
        state,
        addClient,
        updateClient,
        deleteClient,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        updateCompanySettings,
        refreshCompanySettings,
        getDashboardStats,
        getNextInvoiceNumber,
        calculateInvoiceTotals,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
