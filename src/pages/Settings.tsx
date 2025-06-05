
import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  invoice_prefix: string;
  invoice_start_number: number;
}

interface TaxConfiguration {
  id: string;
  province_code: string;
  tax_name: string;
  tax_rate: number;
  is_enabled: boolean;
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
    invoice_prefix: 'INV-',
    invoice_start_number: 1,
  });
  const [taxConfigurations, setTaxConfigurations] = useState<TaxConfiguration[]>([]);

  useEffect(() => {
    console.log('Settings component mounted, user:', !!user);
    loadCompanySettings();
    loadTaxConfigurations();
  }, [user]);

  const loadCompanySettings = async () => {
    if (!user) {
      console.log('No user found, skipping company settings load');
      return;
    }

    console.log('Loading company settings for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('Company settings query result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company settings:', error);
        toast.error('Error loading company settings');
        return;
      }

      if (data && data.length > 0) {
        const companyData = data[0];
        console.log('Found company data:', companyData);
        setFormData({
          id: companyData.id,
          company_name: companyData.company_name || '',
          address: companyData.address || '',
          phone_number: companyData.phone_number || '',
          email: companyData.email || '',
          gst_number: companyData.gst_number || '',
          primary_color: companyData.primary_color || '#3B82F6',
          secondary_color: companyData.secondary_color || '#6B7280',
          invoice_prefix: companyData.invoice_prefix || 'INV-',
          invoice_start_number: companyData.invoice_start_number || 1,
        });
      } else {
        console.log('No company data found, using defaults');
      }
    } catch (error) {
      console.error('Exception loading company settings:', error);
      toast.error('Error loading company settings');
    } finally {
      setLoading(false);
    }
  };

  const loadTaxConfigurations = async () => {
    if (!user) return;

    console.log('Loading tax configurations for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('tax_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('province_code', { ascending: true });

      console.log('Tax configurations query result:', { data, error });

      if (error) {
        console.error('Error loading tax configurations:', error);
        return;
      }

      if (data && data.length === 0) {
        console.log('No tax configurations found, initializing defaults');
        await initializeDefaultTaxConfigurations();
        return;
      }

      setTaxConfigurations(data || []);
    } catch (error) {
      console.error('Error loading tax configurations:', error);
    }
  };

  const initializeDefaultTaxConfigurations = async () => {
    if (!user) return;

    console.log('Initializing default tax configurations');

    const defaultTaxes = [
      { province_code: 'BC', tax_name: 'GST', tax_rate: 5.000 },
      { province_code: 'BC', tax_name: 'GST/PST', tax_rate: 12.000 },
      { province_code: 'AB', tax_name: 'GST', tax_rate: 5.000 },
      { province_code: 'ON', tax_name: 'HST', tax_rate: 13.000 },
      { province_code: 'NS', tax_name: 'HST', tax_rate: 15.000 },
      { province_code: 'NB', tax_name: 'HST', tax_rate: 15.000 },
      { province_code: 'PE', tax_name: 'HST', tax_rate: 15.000 },
      { province_code: 'NL', tax_name: 'HST', tax_rate: 15.000 },
      { province_code: 'QC', tax_name: 'GST + QST', tax_rate: 14.975 },
      { province_code: 'MB', tax_name: 'GST + RST', tax_rate: 12.000 },
      { province_code: 'SK', tax_name: 'GST + PST', tax_rate: 11.000 },
    ];

    try {
      const { data, error } = await supabase
        .from('tax_configurations')
        .insert(
          defaultTaxes.map(tax => ({
            user_id: user.id,
            ...tax,
            is_enabled: false,
          }))
        )
        .select();

      console.log('Default tax configurations insert result:', { data, error });

      if (error) {
        console.error('Error initializing tax configurations:', error);
        return;
      }

      setTaxConfigurations(data || []);
    } catch (error) {
      console.error('Error initializing tax configurations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.log('No user found, cannot save settings');
      toast.error('User not authenticated');
      return;
    }

    console.log('Starting save process');
    console.log('Form data to save:', formData);
    console.log('User ID:', user.id);

    setSaving(true);
    try {
      const saveData = {
        user_id: user.id,
        company_name: formData.company_name,
        address: formData.address,
        phone_number: formData.phone_number,
        email: formData.email,
        gst_number: formData.gst_number,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        invoice_prefix: formData.invoice_prefix,
        invoice_start_number: formData.invoice_start_number,
      };

      console.log('Data being saved to database:', saveData);

      const { data, error } = await supabase
        .from('company_info')
        .upsert(saveData, {
          onConflict: 'user_id'
        })
        .select();

      console.log('Save result:', { data, error });

      if (error) {
        console.error('Error saving settings:', error);
        toast.error(`Error saving settings: ${error.message}`);
        return;
      }

      console.log('Settings saved successfully:', data);
      toast.success('Settings updated successfully');
      
      // Reload the data to ensure UI is up to date
      await loadCompanySettings();
    } catch (error) {
      console.error('Exception saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanySettings, value: string | number) => {
    console.log(`Updating field ${field} to:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaxToggle = async (taxId: string, enabled: boolean) => {
    console.log(`Toggling tax ${taxId} to:`, enabled);
    
    try {
      const { error } = await supabase
        .from('tax_configurations')
        .update({ is_enabled: enabled })
        .eq('id', taxId);

      console.log('Tax toggle result:', { error });

      if (error) {
        console.error('Error updating tax configuration:', error);
        toast.error('Error updating tax configuration');
        return;
      }

      setTaxConfigurations(prev =>
        prev.map(tax =>
          tax.id === taxId ? { ...tax, is_enabled: enabled } : tax
        )
      );

      toast.success('Tax configuration updated');
    } catch (error) {
      console.error('Error updating tax configuration:', error);
      toast.error('Error updating tax configuration');
    }
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

        {/* Invoice Numbering */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Numbering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoice_prefix}
                  onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                  placeholder="INV-, FAT-, or leave blank"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be added before the invoice number (e.g., "INV-001")
                </p>
              </div>
              <div>
                <Label htmlFor="startNumber">Starting Invoice Number</Label>
                <Input
                  id="startNumber"
                  type="number"
                  min="1"
                  value={formData.invoice_start_number}
                  onChange={(e) => handleChange('invoice_start_number', parseInt(e.target.value) || 1)}
                  placeholder="1000"
                />
                <p className="text-sm text-gray-500 mt-1">
                  New invoices will start from this number
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <p className="text-sm text-gray-600">
                Next invoice number: <span className="font-mono font-semibold">
                  {formData.invoice_prefix}{String(formData.invoice_start_number).padStart(3, '0')}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Configuration</CardTitle>
            <p className="text-sm text-gray-600">
              Enable the tax types you want to use in your invoices. Only enabled taxes will appear in the invoice creation form.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taxConfigurations.map((tax) => (
                <div key={tax.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={tax.id}
                    checked={tax.is_enabled}
                    onCheckedChange={(checked) => handleTaxToggle(tax.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={tax.id} className="font-medium cursor-pointer">
                      {tax.province_code} - {tax.tax_name}
                    </Label>
                    <p className="text-sm text-gray-500">{tax.tax_rate}%</p>
                  </div>
                </div>
              ))}
            </div>
            
            {taxConfigurations.filter(t => t.is_enabled).length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No tax options are currently enabled. Enable at least one tax option to use taxes in your invoices.
                </p>
              </div>
            )}
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
