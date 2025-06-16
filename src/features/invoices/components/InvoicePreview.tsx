import React from 'react';
import { Invoice, Client, CompanySettings } from '@/types';
import InvoiceTemplate from './InvoiceTemplate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InvoicePreviewProps {
  invoice: Invoice;
  client: Client;
  companySettings: CompanySettings;
  onEdit: () => void;
  onSend: () => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, client, companySettings, onEdit, onSend }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4">
          <InvoiceTemplate invoice={invoice} client={client} companySettings={companySettings} />
        </div>
<div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onEdit}>Edit</Button>
          <Button onClick={() => window.print()}>Print</Button>
          <Button onClick={onSend}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;
