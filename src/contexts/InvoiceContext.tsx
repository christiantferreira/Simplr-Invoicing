
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Client, Invoice, CompanySettings, DashboardStats } from '@/types';
import { format, addDays, isAfter, startOfMonth, endOfMonth } from 'date-fns';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const clients = JSON.parse(localStorage.getItem('simplr_clients') || '[]');
      const invoices = JSON.parse(localStorage.getItem('simplr_invoices') || '[]');
      const companySettings = JSON.parse(localStorage.getItem('simplr_company_settings') || 'null');

      dispatch({ type: 'SET_CLIENTS', payload: clients });
      dispatch({ type: 'SET_INVOICES', payload: invoices });
      dispatch({ type: 'SET_COMPANY_SETTINGS', payload: companySettings });
      
      // Initialize with sample data if empty
      if (clients.length === 0 && invoices.length === 0) {
        initializeSampleData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const initializeSampleData = () => {
    const sampleClients: Client[] = [
      {
        id: '1',
        name: 'Acme Corporation',
        email: 'john@acme.com',
        phone: '+1 (555) 987-6543',
        company: 'Acme Corp',
        address: '123 Business Ave, New York, NY 10001',
        createdAt: format(new Date(), 'yyyy-MM-dd'),
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@startup.io',
        phone: '+1 (555) 456-7890',
        company: 'Startup Inc',
        address: '456 Tech Street, San Francisco, CA 94107',
        createdAt: format(new Date(), 'yyyy-MM-dd'),
      },
    ];

    const sampleInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-001',
        clientId: '1',
        status: 'paid',
        issueDate: '2024-05-01',
        dueDate: '2024-05-31',
        items: [
          {
            id: '1',
            description: 'Web Design Services',
            quantity: 1,
            unitPrice: 2500,
            total: 2500,
          },
        ],
        subtotal: 2500,
        discount: 0,
        tax: 0,
        total: 2500,
        templateId: 'classic',
        createdAt: '2024-05-01',
        updatedAt: '2024-05-01',
        paidAt: '2024-05-25',
      },
      {
        id: '2',
        invoiceNumber: 'INV-002',
        clientId: '2',
        status: 'sent',
        issueDate: '2024-05-15',
        dueDate: '2024-06-14',
        items: [
          {
            id: '1',
            description: 'Logo Design',
            quantity: 1,
            unitPrice: 800,
            total: 800,
          },
          {
            id: '2',
            description: 'Brand Guidelines',
            quantity: 1,
            unitPrice: 1000,
            total: 1000,
          },
        ],
        subtotal: 1800,
        discount: 0,
        tax: 0,
        total: 1800,
        templateId: 'modern',
        createdAt: '2024-05-15',
        updatedAt: '2024-05-15',
        sentAt: '2024-05-15',
      },
    ];

    dispatch({ type: 'SET_CLIENTS', payload: sampleClients });
    dispatch({ type: 'SET_INVOICES', payload: sampleInvoices });
    
    localStorage.setItem('simplr_clients', JSON.stringify(sampleClients));
    localStorage.setItem('simplr_invoices', JSON.stringify(sampleInvoices));
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: format(new Date(), 'yyyy-MM-dd'),
    };
    dispatch({ type: 'ADD_CLIENT', payload: newClient });
    const updatedClients = [...state.clients, newClient];
    localStorage.setItem('simplr_clients', JSON.stringify(updatedClients));
  };

  const updateClient = (client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
    const updatedClients = state.clients.map(c => c.id === client.id ? client : c);
    localStorage.setItem('simplr_clients', JSON.stringify(updatedClients));
  };

  const deleteClient = (id: string) => {
    dispatch({ type: 'DELETE_CLIENT', payload: id });
    const updatedClients = state.clients.filter(c => c.id !== id);
    localStorage.setItem('simplr_clients', JSON.stringify(updatedClients));
  };

  const getNextInvoiceNumber = () => {
    const invoiceNumbers = state.invoices
      .map(inv => parseInt(inv.invoiceNumber.replace('INV-', '')))
      .filter(num => !isNaN(num));
    
    const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0;
    return `INV-${String(maxNumber + 1).padStart(3, '0')}`;
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = format(new Date(), 'yyyy-MM-dd');
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString(),
      invoiceNumber: getNextInvoiceNumber(),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
    const updatedInvoices = [...state.invoices, newInvoice];
    localStorage.setItem('simplr_invoices', JSON.stringify(updatedInvoices));
  };

  const updateInvoice = (invoice: Invoice) => {
    const updatedInvoice = { ...invoice, updatedAt: format(new Date(), 'yyyy-MM-dd') };
    dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
    const updatedInvoices = state.invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv);
    localStorage.setItem('simplr_invoices', JSON.stringify(updatedInvoices));
  };

  const deleteInvoice = (id: string) => {
    dispatch({ type: 'DELETE_INVOICE', payload: id });
    const updatedInvoices = state.invoices.filter(inv => inv.id !== id);
    localStorage.setItem('simplr_invoices', JSON.stringify(updatedInvoices));
  };

  const updateCompanySettings = (settings: CompanySettings) => {
    dispatch({ type: 'SET_COMPANY_SETTINGS', payload: settings });
    localStorage.setItem('simplr_company_settings', JSON.stringify(settings));
  };

  const getDashboardStats = (): DashboardStats => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const paidInvoices = state.invoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const pendingInvoices = state.invoices.filter(inv => inv.status === 'sent' || inv.status === 'viewed');
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const overdueInvoices = state.invoices.filter(inv => {
      if (inv.status === 'paid') return false;
      return isAfter(now, new Date(inv.dueDate));
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
        getNextInvoiceNumber,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
