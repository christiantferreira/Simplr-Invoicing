import React, { useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Invoice, Client } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  total: z.number(),
});

const invoiceSchema = z.object({
  client_id: z.string().uuid(),
  status: z.enum(['draft', 'ready', 'sent', 'viewed', 'paid', 'overdue']),
  issue_date: z.string(),
  due_date: z.string(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  province: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  clients: Client[];
  onSubmit: (data: InvoiceFormData) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, clients, onSubmit }) => {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      ...invoice,
      items: invoice?.items || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({
    control,
    name: 'items',
  });

  const calculateTotal = (index: number) => {
    const item = watchedItems[index];
    if (item) {
      const total = item.quantity * item.unit_price;
      setValue(`items.${index}.total`, total);
    }
  };

  useEffect(() => {
    watchedItems.forEach((_, index) => {
      calculateTotal(index);
    });
  }, [watchedItems]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="client_id">Client</Label>
            <Select onValueChange={(value) => setValue('client_id', value)} defaultValue={invoice?.client_id}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && <p className="text-red-500">{errors.client_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="issue_date">Issue Date</Label>
            <Input id="issue_date" type="date" {...register('issue_date')} />
            {errors.issue_date && <p className="text-red-500">{errors.issue_date.message}</p>}
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="date" {...register('due_date')} />
            {errors.due_date && <p className="text-red-500">{errors.due_date.message}</p>}
          </div>

          <div>
            <Label>Invoice Items</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <Input {...register(`items.${index}.description`)} placeholder="Description" />
                <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} placeholder="Quantity" />
                <Input type="number" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} placeholder="Unit Price" />
                <Button type="button" onClick={() => remove(index)}>Remove</Button>
              </div>
            ))}
            <Button type="button" onClick={() => append({ description: '', quantity: 1, unit_price: 0, total: 0 })}>
              Add Item
            </Button>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceForm;
