import React from 'react';
import { Invoice, Client, CompanySettings } from '@/types';

interface CreativeInvoiceTemplateProps {
  invoice: Invoice;
  client: Client;
  companySettings: CompanySettings;
}

const CreativeInvoiceTemplate: React.FC<CreativeInvoiceTemplateProps> = ({ invoice, client, companySettings }) => {
  return (
    <div className="p-8 bg-gray-50 font-serif">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold" style={{ color: companySettings.primaryColor }}>
          {companySettings.name}
        </h1>
        <p className="text-gray-600">{companySettings.address}</p>
      </header>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold mb-2 text-gray-600">INVOICE TO</h3>
          <p className="font-bold text-lg">{client.name}</p>
          <p>{client.address}</p>
          <p>{client.email}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold text-gray-800">INVOICE #{invoice.invoice_number}</h2>
          <p><span className="font-bold">Date of Issue:</span> {invoice.issue_date}</p>
          <p><span className="font-bold">Due Date:</span> {invoice.due_date}</p>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr>
            <th className="p-2 text-left font-semibold text-gray-600 border-b-2 border-gray-300">ITEM</th>
            <th className="p-2 text-right font-semibold text-gray-600 border-b-2 border-gray-300">QTY</th>
            <th className="p-2 text-right font-semibold text-gray-600 border-b-2 border-gray-300">RATE</th>
            <th className="p-2 text-right font-semibold text-gray-600 border-b-2 border-gray-300">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item) => (
            <tr key={item.id}>
              <td className="p-2 border-b border-gray-200">{item.description}</td>
              <td className="p-2 text-right border-b border-gray-200">{item.quantity}</td>
              <td className="p-2 text-right border-b border-gray-200">CAD ${item.unit_price.toFixed(2)}</td>
              <td className="p-2 text-right border-b border-gray-200">CAD ${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="flex justify-end mb-8">
        <div className="w-1/3">
          <div className="flex justify-between text-gray-600">
            <p>Subtotal</p>
            <p>CAD ${invoice.subtotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-gray-600">
            <p>Discount</p>
            <p>-CAD ${invoice.discount.toFixed(2)}</p>
          </div>
          <div className="flex justify-between text-gray-600">
            <p>Tax</p>
            <p>CAD ${invoice.tax.toFixed(2)}</p>
          </div>
          <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t-2" style={{ borderColor: companySettings.primaryColor }}>
            <p>Total</p>
            <p>CAD ${invoice.total.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {invoice.notes && (
        <section className="mt-8 text-center">
          <h3 className="font-bold mb-2 text-gray-600">Thank you for your business!</h3>
          <p className="text-gray-600">{invoice.notes}</p>
        </section>
      )}
    </div>
  );
};

export default CreativeInvoiceTemplate;
