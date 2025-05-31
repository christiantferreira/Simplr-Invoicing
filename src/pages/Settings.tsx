
import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoice } from '@/contexts/InvoiceContext';
import { CompanySettings } from '@/types';
import { toast } from 'sonner';

const Settings = () => {
  const { state, updateCompanySettings } = useInvoice();
  const [formData, setFormData] = useState<CompanySettings>(
    state.companySettings || {
      id: '1',
      name: '',
      address: '',
      phone: '',
      email: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    toast.success('Settings updated successfully');
  };

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your company information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your company name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber || ''}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                  placeholder="Enter your business GST number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Business St, City, State 12345"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Primary Color</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded border-2 border-gray-300"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Secondary Color</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-12 h-12 rounded border-2 border-gray-300"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    placeholder="#6B7280"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Color Preview</h4>
              <div 
                className="p-4 rounded text-white"
                style={{ backgroundColor: formData.primaryColor }}
              >
                <h5 className="font-semibold">Invoice Header</h5>
                <p style={{ color: formData.secondaryColor }}>
                  This is how your brand colors will appear on invoices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
