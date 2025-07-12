import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

type RecurringInvoice = {
  id: string;
  frequency: string;
  start_date: string;
  next_generation_date: string;
  is_active: boolean;
  clients: { name: string } | null;
};

const fetchRecurringInvoices = async () => {
  const { data, error } = await supabase
    .from('recurring_invoices')
    .select(`
      id,
      frequency,
      start_date,
      next_generation_date,
      is_active,
      clients ( name )
    `);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const toggleRecurringStatus = async ({ id, currentStatus }: { id: string, currentStatus: boolean }) => {
  const { data, error } = await supabase
    .from('recurring_invoices')
    .update({ is_active: !currentStatus })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const RecurringInvoiceList: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: invoices, isLoading, isError } = useQuery({
    queryKey: ['recurring_invoices'],
    queryFn: fetchRecurringInvoices,
  });

  const mutation = useMutation({
    mutationFn: toggleRecurringStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_invoices'] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return <div>Error loading recurring invoices.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice: RecurringInvoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.clients?.name || 'N/A'}</TableCell>
                  <TableCell>{invoice.frequency}</TableCell>
                  <TableCell>{new Date(invoice.next_generation_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.is_active ? 'default' : 'destructive'}>
                      {invoice.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mutation.mutate({ id: invoice.id, currentStatus: invoice.is_active })}
                      disabled={mutation.isPending}
                    >
                      {invoice.is_active ? 'Pause' : 'Resume'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No recurring invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecurringInvoiceList;
