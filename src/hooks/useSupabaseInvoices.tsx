
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Client, Invoice, InvoiceItem } from '@/types';

export const useSupabaseInvoices = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Load clients from Supabase
  const loadClients = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const formattedClients: Client[] = (data || []).map(client => ({
        id: client.id,
        name: client.contact_name || '',
        email: client.email || '',
        phone: client.phone_number || '',
        company: client.company_name || '',
        address: client.address || '',
        createdAt: new Date(client.created_at).toISOString().split('T')[0],
      }));
      
      setClients(formattedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Load invoices from Supabase
  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id);
      
      if (invoicesError) throw invoicesError;
      
      // Load invoice items for all invoices
      const invoiceIds = (invoicesData || []).map(inv => inv.id);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds);
      
      if (itemsError) throw itemsError;
      
      const formattedInvoices: Invoice[] = (invoicesData || []).map(invoice => {
        const invoiceItems: InvoiceItem[] = (itemsData || [])
          .filter(item => item.invoice_id === invoice.id)
          .map(item => ({
            id: item.id,
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: Number(item.unit_price) || 0,
            total: Number(item.total) || 0,
          }));

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number || '',
          clientId: invoice.client_id,
          status: invoice.status as any || 'draft',
          issueDate: invoice.issue_date || '',
          dueDate: invoice.due_date || '',
          items: invoiceItems,
          subtotal: Number(invoice.subtotal) || 0,
          discount: Number(invoice.discount) || 0,
          tax: Number(invoice.tax) || 0,
          total: Number(invoice.total) || 0,
          notes: invoice.notes || '',
          templateId: 'classic' as any,
          createdAt: new Date(invoice.created_at).toISOString().split('T')[0],
          updatedAt: new Date(invoice.created_at).toISOString().split('T')[0],
        };
      });
      
      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  // Load data when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setClients([]);
        setInvoices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([loadClients(), loadInvoices()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    clients,
    invoices,
    loading,
    refetch: () => {
      if (user) {
        loadClients();
        loadInvoices();
      }
    }
  };
};
