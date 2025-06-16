import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const notificationSettingsSchema = z.object({
  emailOnInvoiceSent: z.boolean().optional(),
  emailOnInvoicePaid: z.boolean().optional(),
  emailOnInvoiceOverdue: z.boolean().optional(),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

interface NotificationSettingsFormProps {
  notificationSettings?: NotificationSettingsFormData;
  onSubmit: (data: NotificationSettingsFormData) => void;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ notificationSettings, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: notificationSettings,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailOnInvoiceSent">Email on Invoice Sent</Label>
            <Switch id="emailOnInvoiceSent" {...register('emailOnInvoiceSent')} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="emailOnInvoicePaid">Email on Invoice Paid</Label>
            <Switch id="emailOnInvoicePaid" {...register('emailOnInvoicePaid')} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="emailOnInvoiceOverdue">Email on Invoice Overdue</Label>
            <Switch id="emailOnInvoiceOverdue" {...register('emailOnInvoiceOverdue')} />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsForm;
