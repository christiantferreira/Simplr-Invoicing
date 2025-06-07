
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Client, Invoice, InvoiceItem } from '@/types';

export const useSupabaseInvoices = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get next invoice number based on company settings
  const getNextInvoiceNumber = async (): Promise<string> => {
    if (!user) return '001';

    try {
      // Get company settings for prefix and starting number
      const { data: companyData } = await supabase
        .from('company_info')
        .select('invoice_prefix, invoice_start_number')
        .eq('user_id', user.id)
        .maybeSingle();

      const prefix = companyData?.invoice_prefix || '';
      const startNumber = companyData?.invoice_start_number || 1;

      // Get the highest invoice number from existing invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let nextNumber = startNumber;

      if (invoicesData && invoicesData.length > 0) {
        // Find the highest number from existing invoices with the same prefix
        const numbers = invoicesData
          .map(inv => inv.invoice_number)
          .filter(num => {
            if (!num) return false;
            // If prefix is empty, check if the invoice number is purely numeric
            if (prefix === '') {
              return /^\d+$/.test(num);
            }
            // Otherwise, check if it starts with the prefix
            return num.startsWith(prefix);
          })
          .map(num => {
            const numberPart = num?.replace(prefix, '');
            return parseInt(numberPart || '0', 10);
          })
          .filter(num => !isNaN(num));

        if (numbers.length > 0) {
          const maxNumber = Math.max(...numbers);
          nextNumber = Math.max(maxNumber + 1, startNumber);
        }
      }

      return `${prefix}${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return '001';
    }
  };

  // Load clients from Supabase
  const loadClients = async () => {
    if (!user) return;
    
    try {
      console.log('Loading clients for user:', user.id);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error loading clients:', error);
        throw error;
      }
      
      console.log('Loaded clients:', data);
      const formattedClients: Client[] = (data || []).map(client => ({
        id: client.id,
        name: client.contact_name || '',
        email: client.email || '',
        phone: client.phone_number || '',
        company: client.company_name || '',
        address: client.address || '',
        createdAt: client.created_at ? new Date(client.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      
      setClients(formattedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Failed to load clients');
    }
  };

  // Load invoices from Supabase
  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      console.log('Loading invoices for user:', user.id);
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id);
      
      if (invoicesError) {
        console.error('Error loading invoices:', invoicesError);
        throw invoicesError;
      }
      
      console.log('Loaded invoices:', invoicesData);
      
      if (!invoicesData || invoicesData.length === 0) {
        console.log('No invoices found for user');
        setInvoices([]);
        return;
      }

      // Load invoice items for all invoices
      const invoiceIds = invoicesData.map(inv => inv.id);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds);
      
      if (itemsError) {
        console.error('Error loading invoice items:', itemsError);
        throw itemsError;
      }
      
      console.log('Loaded invoice items:', itemsData);
      
      const formattedInvoices: Invoice[] = invoicesData.map(invoice => {
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
      
      console.log('Formatted invoices:', formattedInvoices);
      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setError('Failed to load invoices');
    }
  };

  // Create sample data if none exists
  const createSampleData = async () => {
    if (!user) return;
    
    try {
      console.log('Creating sample data for user:', user.id);
      
      // Check if client already exists
      const { data: existingClients } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      let clientId;
      
      if (!existingClients || existingClients.length === 0) {
        // Create sample client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            company_name: 'Acme Corporation',
            contact_name: 'John Smith',
            email: 'john@acme.com',
            phone_number: '+1 (555) 987-6543',
            address: '123 Business Ave\nNew York, NY 10001'
          })
          .select()
          .single();
        
        if (clientError) throw clientError;
        clientId = clientData.id;
        console.log('Created sample client:', clientData);
      } else {
        clientId = existingClients[0].id;
      }
      
      // Check if invoice already exists
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (!existingInvoices || existingInvoices.length === 0) {
        // Get next invoice number
        const invoiceNumber = await getNextInvoiceNumber();
        
        // Create sample invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            user_id: user.id,
            client_id: clientId,
            invoice_number: invoiceNumber,
            status: 'sent',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal: 2500.00,
            discount: 0.00,
            tax: 0.00,
            total: 2500.00,
            notes: 'Thank you for your business!'
          })
          .select()
          .single();
        
        if (invoiceError) throw invoiceError;
        console.log('Created sample invoice:', invoiceData);
        
        // Create sample invoice item
        const { data: itemData, error: itemError } = await supabase
          .from('invoice_items')
          .insert({
            invoice_id: invoiceData.id,
            description: 'Web Design Services',
            quantity: 1,
            unit_price: 2500.00,
            total: 2500.00
          })
          .select()
          .single();
        
        if (itemError) throw itemError;
        console.log('Created sample invoice item:', itemData);
      }
      
    } catch (error) {
      console.error('Error creating sample data:', error);
      // Don't set error state for sample data creation failure
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
      setError(null);
      
      // First, try to create sample data if none exists
      await createSampleData();
      
      // Then load all data
      await Promise.all([loadClients(), loadInvoices()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  // Add client to Supabase
  const addClient = async (clientData: Omit<any, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
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

      // Reload clients to update the state
      await loadClients();
      
      return clientResult;
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  };

  // Update invoice in Supabase
  const updateInvoice = async (invoiceData: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update invoice in Supabase
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          client_id: invoiceData.clientId,
          status: invoiceData.status,
          issue_date: invoiceData.issueDate,
          due_date: invoiceData.dueDate,
          subtotal: invoiceData.subtotal,
          discount: invoiceData.discount,
          tax: invoiceData.tax,
          total: invoiceData.total,
          notes: invoiceData.notes,
        })
        .eq('id', invoiceData.id)
        .eq('user_id', user.id);

      if (invoiceError) throw invoiceError;

      // Update invoice items
      if (invoiceData.items && invoiceData.items.length > 0) {
        // Delete existing items
        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceData.id);

        // Insert new items
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(
            invoiceData.items.map((item: any) => ({
              invoice_id: invoiceData.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: item.total,
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Reload invoices to update the state
      await loadInvoices();
      
      return invoiceData;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  return {
    clients,
    invoices,
    loading,
    error,
    getNextInvoiceNumber,
    addClient,
    updateInvoice,
    refetch: () => {
      if (user) {
        setLoading(true);
        setError(null);
        Promise.all([loadClients(), loadInvoices()]).finally(() => setLoading(false));
      }
    }
  };
};
