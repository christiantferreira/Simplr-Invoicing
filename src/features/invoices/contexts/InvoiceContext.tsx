
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Client, Invoice, CompanySettings, DashboardStats } from '@/types';
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
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
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

  const loadCompanySettings = async () => {
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
        dispatch({ type: 'SET_COMPANY_SETTINGS', payload: companySettings });
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
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
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
