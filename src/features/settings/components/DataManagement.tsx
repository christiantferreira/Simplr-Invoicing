import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/features/invoices/hooks/useInvoices';
import { useClients } from '@/features/clients/hooks/useClients';

const DataManagement = () => {
  const { data: invoices } = useInvoices();
  const { data: clients } = useClients();

  const handleExport = () => {
    const data = {
      invoices,
      clients,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simplr-invoicing-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport}>Export Data</Button>
      </CardContent>
    </Card>
  );
};

export default DataManagement;
