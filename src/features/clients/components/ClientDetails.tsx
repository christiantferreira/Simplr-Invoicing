import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';

interface ClientDetailsProps {
  clientId: string;
}

const fetchClientDetails = async (clientId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const updateClientNotes = async ({ clientId, notes }: { clientId: string, notes: string | null }) => {
  const { data, error } = await supabase
    .from('clients')
    .update({ notes })
    .eq('id', clientId);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const ClientDetails: React.FC<ClientDetailsProps> = ({ clientId }) => {
  const queryClient = useQueryClient();
  const [currentNotes, setCurrentNotes] = useState('');

  const { data: client, isLoading, isError } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => fetchClientDetails(clientId),
  });

  useEffect(() => {
    if (client) {
      setCurrentNotes(client.notes || '');
    }
  }, [client]);

  const mutation = useMutation({
    mutationFn: updateClientNotes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
    },
  });

  const handleSaveNotes = () => {
    mutation.mutate({ clientId, notes: currentNotes });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !client) {
    return <div>Error loading client details.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{client.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Email:</strong> {client.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
          <p><strong>Address:</strong> {client.address || 'N/A'}</p>
          <p><strong>Company:</strong> {client.company || 'N/A'}</p>
        </CardContent>
      </Card>

      {/* Placeholder for History Section */}
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Client history will be displayed here.</p>
          {/* We will map over client.history here */}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Add notes for this client..."
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            rows={5}
          />
          <Button onClick={handleSaveNotes} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Notes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDetails;
