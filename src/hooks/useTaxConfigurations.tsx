
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
      const { data, error } = await supabase
        .from('tax_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .order('province_code', { ascending: true });

      if (error) {
        console.error('Error loading tax configurations:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId: user.id
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
      value: `${tax.tax_name}-${tax.tax_rate}`,
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
