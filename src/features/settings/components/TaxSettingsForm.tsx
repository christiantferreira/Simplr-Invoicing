import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaxConfiguration } from '@/types';

const taxConfigurationSchema = z.object({
  taxConfigurations: z.array(
    z.object({
      province_code: z.string().min(2).max(2),
      tax_name: z.string().min(1),
      tax_rate: z.number().min(0),
      is_enabled: z.boolean(),
    })
  ),
});

type TaxSettingsFormData = z.infer<typeof taxConfigurationSchema>;

interface TaxSettingsFormProps {
  taxConfigurations: TaxConfiguration[];
  onSubmit: (data: TaxSettingsFormData) => void;
}

const TaxSettingsForm: React.FC<TaxSettingsFormProps> = ({ taxConfigurations, onSubmit }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<TaxSettingsFormData>({
    resolver: zodResolver(taxConfigurationSchema),
    defaultValues: {
      taxConfigurations,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "taxConfigurations",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <Input {...register(`taxConfigurations.${index}.province_code`)} placeholder="Province" />
              <Input {...register(`taxConfigurations.${index}.tax_name`)} placeholder="Tax Name" />
              <Input type="number" {...register(`taxConfigurations.${index}.tax_rate`, { valueAsNumber: true })} placeholder="Tax Rate" />
              <Button type="button" onClick={() => remove(index)}>Remove</Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() =>
              append({
                province_code: '',
                tax_name: '',
                tax_rate: 0,
                is_enabled: true,
              })
            }
          >
            Add Tax Configuration
          </Button>
          <Button type="submit">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaxSettingsForm;
