import React from 'react';
import { Invoice, Client, CompanySettings } from '@/types';

interface InvoiceTemplateProps {
  invoice: Invoice;
  client: Client;
  companySettings: CompanySettings;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, client, companySettings }) => {
  return (
    <div className="p-8 bg-white shadow-lg">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: companySettings.primaryColor }}>
            {companySettings.name}
          </h1>
          <p>{companySettings.address}</p>
          <p>{companySettings.phone}</p>
          <p>{companySettings.email}</p>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-gray-800">INVOICE</h2>
          <p className="text-gray-600"># {invoice.invoice_number}</p>
        </div>
      </header>

      <section className="flex justify-between mb-8">
        <div>
          <h3 className="font-bold mb-2">Bill To:</h3>
          <p>{client.name}</p>
          <p>{client.address}</p>
          <p>{client.email}</p>
        </div>
        <div>
          <p><span className="font-bold">Issue Date:</span> {invoice.issue_date}</p>
          <p><span className="font-bold">Due Date:</span> {invoice.due_date}</p>
        </div>
      </section>

      <table className="w-full mb-8">
        <thead>
          <tr style={{ backgroundColor: companySettings.primaryColor, color: 'white' }}>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-right">Quantity</th>
            <th className="p-2 text-right">Unit Price</th>
            <th className="p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item) => (
            <tr key={item.id}>
              <td className="p-2">{item.description}</td>
              <td className="p-2 text-right">{item.quantity}</td>
              <td className="p-2 text-right">${item.unit_price.toFixed(2)}</td>
              <td className="p-2 text-right">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="flex justify-end mb-8">
        <div className="w-1/3">
          <div className="flex justify-between">
            <p>Subtotal:</p>
            <p>${invoice.subtotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p>Discount:</p>
            <p>-${invoice.discount.toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p>Tax:</p>
            <p>${invoice.tax.toFixed(2)}</p>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
            <p>Total:</p>
            <p>${invoice.total.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {invoice.notes && (
        <section>
          <h3 className="font-bold mb-2">Notes:</h3>
          <p>{invoice.notes}</p>
        </section>
      )}
    </div>
  );
};

export default InvoiceTemplate;
