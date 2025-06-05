
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Client, Invoice, CompanySettings, DashboardStats } from '@/types';
import { format, addDays, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { useSupabaseInvoices } from '@/hooks/useSupabaseInvoices';

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
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  updateCompanySettings: (settings: CompanySettings) => void;
  getDashboardStats: () => DashboardStats;
  getNextInvoiceNumber: () => string;
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
  const { clients, invoices, loading, getNextInvoiceNumber } = useSupabaseInvoices();

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

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: format(new Date(), 'yyyy-MM-dd'),
    };
    dispatch({ type: 'ADD_CLIENT', payload: newClient });
  };

  const updateClient = (client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
  };

  const deleteClient = (id: string) => {
    dispatch({ type: 'DELETE_CLIENT', payload: id });
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = format(new Date(), 'yyyy-MM-dd');
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString(),
      invoiceNumber: getNextInvoiceNumber ? getNextInvoiceNumber() : 'INV-001',
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
  };

  const updateInvoice = (invoice: Invoice) => {
    const updatedInvoice = { ...invoice, updatedAt: format(new Date(), 'yyyy-MM-dd') };
    dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
  };

  const deleteInvoice = (id: string) => {
    dispatch({ type: 'DELETE_INVOICE', payload: id });
  };

  const updateCompanySettings = (settings: CompanySettings) => {
    dispatch({ type: 'SET_COMPANY_SETTINGS', payload: settings });
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
        getDashboardStats,
        getNextInvoiceNumber: getNextInvoiceNumber || (() => 'INV-001'),
        calculateInvoiceTotals,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
