import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TemplateId } from '@/types';

const invoiceCustomizationSchema = z.object({
  defaultTemplate: z.enum(['classic', 'modern', 'creative', 'professional']),
});

type InvoiceCustomizationFormData = z.infer<typeof invoiceCustomizationSchema>;

interface InvoiceCustomizationFormProps {
  defaultTemplate?: TemplateId;
  onSubmit: (data: InvoiceCustomizationFormData) => void;
}

const InvoiceCustomizationForm: React.FC<InvoiceCustomizationFormProps> = ({ defaultTemplate, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<InvoiceCustomizationFormData>({
    resolver: zodResolver(invoiceCustomizationSchema),
    defaultValues: {
      defaultTemplate,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Customization</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="defaultTemplate">Default Template</Label>
            <Select onValueChange={(value) => console.log(value)} defaultValue={defaultTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceCustomizationForm;
