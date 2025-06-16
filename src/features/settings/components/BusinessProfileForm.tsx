import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySettings } from '@/types';

const companySettingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address'),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  hasGST: z.boolean().optional(),
  gstNumber: z.string().optional(),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

interface BusinessProfileFormProps {
  companySettings?: CompanySettings;
  onSubmit: (data: CompanySettingsFormData) => void;
}

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ companySettings, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: companySettings,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" {...register('address')} />
          </div>
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input id="primaryColor" {...register('primaryColor')} />
          </div>
          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <Input id="secondaryColor" {...register('secondaryColor')} />
          </div>
          <div>
            <Label htmlFor="gstNumber">GST Number</Label>
            <Input id="gstNumber" {...register('gstNumber')} />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BusinessProfileForm;
