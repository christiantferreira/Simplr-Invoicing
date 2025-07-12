import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

const formSchema = z.object({
  clientId: z.string().uuid({ message: "Please select a client." }),
  templateInvoiceId: z.string().uuid({ message: "Please select a template invoice." }),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
    required_error: "Please select a frequency.",
  }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date.",
  }),
  endDate: z.string().optional(),
  // A simple approach for next_generation_date. A more robust solution would calculate this on the backend.
  next_generation_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid next generation date.",
  }),
});

type RecurringInvoiceFormValues = z.infer<typeof formSchema>;

const createRecurringInvoice = async (values: RecurringInvoiceFormValues) => {
  // Note: In a real app, you might want to omit `next_generation_date` and have a trigger calculate it.
  // For simplicity here, we pass it from the client.
  const { data, error } = await supabase
    .from('recurring_invoices')
    .insert([
      {
        client_id: values.clientId,
        template_invoice_id: values.templateInvoiceId,
        frequency: values.frequency,
        start_date: values.startDate,
        end_date: values.endDate || null,
        next_generation_date: values.next_generation_date,
        is_active: true,
      },
    ]);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};


const RecurringInvoiceForm: React.FC = () => {
  const queryClient = useQueryClient();
  const form = useForm<RecurringInvoiceFormValues>({
    resolver: zodResolver(formSchema),
    // Set default next_generation_date to today for simplicity
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      next_generation_date: new Date().toISOString().split('T')[0],
    }
  });

  const mutation = useMutation({
    mutationFn: createRecurringInvoice,
    onSuccess: () => {
      console.log('Recurring invoice created successfully!');
      queryClient.invalidateQueries({ queryKey: ['recurring_invoices'] });
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating recurring invoice:', error.message);
    }
  });

  const onSubmit = (data: RecurringInvoiceFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Recurring Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Client Selector Placeholder */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <Input placeholder="Select a client..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Invoice Selector Placeholder */}
            <FormField
              control={form.control}
              name="templateInvoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Invoice</FormLabel>
                  <FormControl>
                    <Input placeholder="Select a template invoice..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* This is a simplified field for demo. In a real app, this would likely be calculated. */}
            <FormField
              control={form.control}
              name="next_generation_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Generation Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Recurring Invoice'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RecurringInvoiceForm;
