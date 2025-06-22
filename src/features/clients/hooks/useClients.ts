import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';

const fetchClients = async () => {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) throw new Error(error.message);
  return data as Client[];
};

export const useClients = () => {
  return useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });
};

const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'user_id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const { data, error } = await supabase.from('clients').insert({ ...client, user_id: user.id }).select();
  if (error) throw new Error(error.message);
  return data;
};

export const useAddClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

const updateClient = async (client: Client) => {
  const { data, error } = await supabase.from('clients').update(client).eq('id', client.id).select();
  if (error) throw new Error(error.message);
  return data;
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

const deleteClient = async (id: string) => {
  const { data, error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return data;
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
