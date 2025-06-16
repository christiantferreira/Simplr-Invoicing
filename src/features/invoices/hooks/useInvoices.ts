import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';

const fetchInvoices = async () => {
  const { data, error } = await supabase.from('invoices').select('*');
  if (error) throw new Error(error.message);
  return data as Invoice[];
};

export const useInvoices = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel('invoices');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<Invoice[], Error>({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });
};

const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase.from('invoices').insert(invoice).select();
  if (error) throw new Error(error.message);
  return data;
};

export const useAddInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

const updateInvoice = async (invoice: Invoice) => {
  const { data, error } = await supabase.from('invoices').update(invoice).eq('id', invoice.id).select();
  if (error) throw new Error(error.message);
  return data;
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

const deleteInvoice = async (id: string) => {
  const { data, error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return data;
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};
