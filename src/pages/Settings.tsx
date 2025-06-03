
import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CompanySettings {
  id?: string;
  company_name: string;
  address: string;
  phone_number: string;
  email: string;
  gst_number: string;
  primary_color: string;
  secondary_color: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CompanySettings>({
    company_name: '',
    address: '',
    phone_number: '',
    email: '',
    gst_number: '',
    primary_color: '#3B82F6',
    secondary_color: '#6B7280',
  });

  useEffect(() => {
    loadCompanySettings();
  }, [user]);

  const loadCompanySettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company settings:', error);
        toast.error('Error loading company settings');
        return;
      }

      if (data) {
        setFormData({
          id: data.id,
          company_name: data.company_name || '',
          address: data.address || '',
          phone_number: data.phone_number || '',
          email: data.email || '',
          gst_number: data.gst_number || '',
          primary_color: data.primary_color || '#3B82F6',
          secondary_color: data.secondary_color || '#6B7280',
        });
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
      toast.error('Error loading company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_info')
        .upsert({
          user_id: user.id,
          company_name: formData.company_name,
          address: formData.address,
          phone_number: formData.phone_number,
          email: formData.email,
          gst_number: formData.gst_number,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
        });

      if (error) {
        console.error('Error saving settings:', error);
        toast.error('Error saving settings');
        return;
      }

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Your company name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
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
                  value={formData.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={formData.gst_number}
                  onChange={(e) => handleChange('gst_number', e.target.value)}
                  placeholder="Enter your business GST number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                value={formData.address}
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
                    value={formData.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="w-12 h-12 rounded border-2 border-gray-300"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
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
                    value={formData.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="w-12 h-12 rounded border-2 border-gray-300"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
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
                style={{ backgroundColor: formData.primary_color }}
              >
                <h5 className="font-semibold">Invoice Header</h5>
                <p style={{ color: formData.secondary_color }}>
                  This is how your brand colors will appear on invoices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
