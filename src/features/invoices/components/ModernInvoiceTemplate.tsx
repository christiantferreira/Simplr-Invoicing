import React from 'react';
import { Invoice, Client, CompanySettings } from '@/types';

interface ModernInvoiceTemplateProps {
  invoice: Invoice;
  client: Client;
  companySettings: CompanySettings;
}

const ModernInvoiceTemplate: React.FC<ModernInvoiceTemplateProps> = ({ invoice, client, companySettings }) => {
  return (
    <div className="p-8 bg-white shadow-lg font-sans">
      <header className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: companySettings.primaryColor }}>
              {companySettings.name}
            </h1>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-800">INVOICE</h2>
            <p className="text-gray-600"># {invoice.invoice_number}</p>
          </div>
        </div>
        <div className="mt-4 border-t-2" style={{ borderColor: companySettings.primaryColor }}></div>
      </header>

      <section className="flex justify-between mb-8">
        <div className="w-1/2">
          <h3 className="font-bold mb-2 text-gray-600">BILL TO</h3>
          <p className="font-bold text-lg">{client.name}</p>
          <p>{client.address}</p>
          <p>{client.email}</p>
        </div>
        <div className="w-1/2 text-right">
          <p><span className="font-bold">Issue Date:</span> {invoice.issue_date}</p>
          <p><span className="font-bold">Due Date:</span> {invoice.due_date}</p>
        </div>
      </section>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="p-2 text-left font-semibold text-gray-600">DESCRIPTION</th>
            <th className="p-2 text-right font-semibold text-gray-600">QTY</th>
            <th className="p-2 text-right font-semibold text-gray-600">UNIT PRICE</th>
            <th className="p-2 text-right font-semibold text-gray-600">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
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
          <div className="flex justify-between text-gray-600">
            <p>Subtotal:</p>
            <p>${invoice.subtotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-gray-600">
            <p>Discount:</p>
            <p>-${invoice.discount.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-gray-600">
            <p>Tax:</p>
            <p>${invoice.tax.toFixed(2)}</p>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t-2" style={{ borderColor: companySettings.primaryColor }}>
            <p>Total:</p>
            <p>${invoice.total.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {invoice.notes && (
        <section className="mt-8">
          <h3 className="font-bold mb-2 text-gray-600">NOTES</h3>
          <p className="text-gray-600">{invoice.notes}</p>
        </section>
      )}
    </div>
  );
};

export default ModernInvoiceTemplate;
