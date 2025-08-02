
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TaxConfiguration {
  id: string;
  province_code: string;
  tax_name: string;
  tax_rate: number;
  is_enabled: boolean;
}

export const useTaxConfigurations = () => {
  const { user } = useAuth();
  const [taxConfigurations, setTaxConfigurations] = useState<TaxConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTaxConfigurations = async () => {
    if (!user) {
      setTaxConfigurations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First, get user's province and service provider status from settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('province, is_service_provider')
        .eq('user_id', user.id)
        .single();

      if (settingsError) {
        console.error('Error loading user settings:', settingsError);
        setError(`Failed to load user settings: ${settingsError.message}`);
        return;
      }

      const userProvince = settingsData?.province;
      const isServiceProvider = settingsData?.is_service_provider;
      
      if (!userProvince) {
        console.warn('User province not found in settings');
        setTaxConfigurations([]);
        setLoading(false);
        return;
      }

      // Build query for tax configurations
      let query = supabase
        .from('tax_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('province_code', userProvince)
        .eq('is_enabled', true);

      // For service providers, only show GST/HST (exclude PST, QST, etc.)
      if (isServiceProvider) {
        query = query.in('tax_name', ['GST', 'HST']);
      }

      query = query.order('tax_name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error loading tax configurations:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId: user.id,
          userProvince: userProvince,
          isServiceProvider: isServiceProvider
        });
        setError(`Failed to load tax configurations: ${error.message}`);
        return;
      }

      setTaxConfigurations(data || []);
    } catch (error) {
      console.error('Error loading tax configurations:', error);
      setError('Failed to load tax configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxConfigurations();
  }, [user]);

  const getEnabledTaxOptions = () => {
    return taxConfigurations.map(tax => ({
      value: `${tax.province_code}-${tax.tax_name}-${tax.tax_rate}`,
      label: `${tax.tax_name} (${tax.tax_rate}%)`,
      rate: tax.tax_rate,
      name: tax.tax_name,
    }));
  };

  return {
    taxConfigurations,
    loading,
    error,
    getEnabledTaxOptions,
    refetch: loadTaxConfigurations,
  };
};
