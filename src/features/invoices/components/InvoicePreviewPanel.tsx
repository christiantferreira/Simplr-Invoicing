
import React from 'react';
import { Invoice, Client, CompanySettings } from '@/types';
import { format } from 'date-fns';

interface InvoicePreviewPanelProps {
  invoice: Partial<Invoice>;
  client: Client | null;
  companySettings: CompanySettings | null;
}

interface ExtendedClient extends Client {
  hasGST?: boolean;
  gstNumber?: string;
}

const InvoicePreviewPanel: React.FC<InvoicePreviewPanelProps> = ({
  invoice,
  client,
  companySettings,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  if (!companySettings) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
        Loading preview...
      </div>
    );
  }

  const templateStyles = {
    classic: {
      headerBg: 'bg-simplr-primary',
      headerText: 'text-simplr-on-dark',
      accentColor: 'text-simplr-primary',
      borderColor: 'border-simplr-accent',
    },
    modern: {
      headerBg: 'bg-gray-800',
      headerText: 'text-white',
      accentColor: 'text-gray-800',
      borderColor: 'border-gray-200',
    },
    creative: {
      headerBg: 'bg-simplr-accent',
      headerText: 'text-simplr-primary',
      accentColor: 'text-simplr-accent',
      borderColor: 'border-simplr-accent',
    },
    professional: {
      headerBg: 'bg-slate-700',
      headerText: 'text-white',
      accentColor: 'text-slate-700',
      borderColor: 'border-slate-200',
    },
  };

  // Always use classic template
  const style = templateStyles.classic;

  return (
    <div id="invoice-content" className="bg-white border rounded-lg overflow-hidden shadow-sm invoice-content">
      {/* Header */}
      <div className={`${style.headerBg} ${style.headerText} p-6`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">INVOICE</h1>
            <p className="mt-1 opacity-90">
              #{invoice.invoice_number || 'INV-XXX'}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">
              {companySettings.name === 'Company Name Not Set' ? (
                <span className="text-gray-400 italic">Company Name Not Set</span>
              ) : (
                companySettings.name
              )}
            </h2>
            {companySettings.address && companySettings.address !== 'Company Address Not Set' && (
              <div className="mt-2 text-sm opacity-90">
                {companySettings.address.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}
            {companySettings.address === 'Company Address Not Set' && (
              <div className="mt-2 text-sm text-gray-400 italic opacity-90">Company Address Not Set</div>
            )}
            {companySettings.phone && companySettings.phone !== 'Phone Number Not Set' && (
              <div className="text-sm opacity-90 mt-1">{companySettings.phone}</div>
            )}
            {companySettings.phone === 'Phone Number Not Set' && (
              <div className="text-sm text-gray-400 italic opacity-90 mt-1">Phone Number Not Set</div>
            )}
            {companySettings.email && companySettings.email !== 'Email Not Set' && (
              <div className="text-sm opacity-90">{companySettings.email}</div>
            )}
            {companySettings.email === 'Email Not Set' && (
              <div className="text-sm text-gray-400 italic opacity-90">Email Not Set</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Bill To & Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className={`font-semibold ${style.accentColor} mb-3`}>Bill To:</h3>
            {client ? (
              <div className="text-sm space-y-1">
                <div className="font-medium">{client.name}</div>
                {client.company && <div>{client.company}</div>}
                {client.address && (
                  <div className="text-gray-600">
                    {client.address.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                )}
                <div className="text-gray-600">{client.email}</div>
                {client.phone && <div className="text-gray-600">{client.phone}</div>}
                {(client as ExtendedClient).hasGST && (client as ExtendedClient).gstNumber && (
                  <div className="text-gray-600">GST: {(client as ExtendedClient).gstNumber}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Select a client</div>
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${style.accentColor} mb-3`}>Invoice Details:</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span>{invoice.issueDate ? formatDate(invoice.issueDate) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className={`${style.borderColor} border-b-2`}>
                <th className="text-left py-3 font-semibold">Description</th>
                <th className="text-center py-3 font-semibold w-20">Qty</th>
                <th className="text-right py-3 font-semibold w-24">Price</th>
                <th className="text-right py-3 font-semibold w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={item.id || index} className="border-b border-gray-100">
                  <td className="py-3">
                    <div className="font-medium">
                      {item.description || 'Item description'}
                    </div>
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
              {!invoice.items?.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Add items to see them here
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            {(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Discount {invoice.discount_type === 'percentage' ? `(${invoice.discount}%)` : ''}:
                </span>
                <span>
                  -{formatCurrency(
                    invoice.discount_type === 'percentage' 
                      ? ((invoice.subtotal || 0) * (invoice.discount || 0)) / 100
                      : (invoice.discount || 0)
                  )}
                </span>
              </div>
            )}
            {(invoice.tax || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span>{formatCurrency(invoice.tax || 0)}</span>
              </div>
            )}
            <div className={`flex justify-between text-lg font-semibold pt-2 border-t ${style.borderColor}`}>
              <span>Total:</span>
              <span className={style.accentColor}>{formatCurrency(invoice.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className={`font-semibold ${style.accentColor} mb-2`}>Notes:</h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">
              {invoice.notes}
            </div>
          </div>
        )}

        {/* Footer with GST */}
        {companySettings.hasGST && companySettings.gstNumber && (
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <div className="text-sm text-gray-600">GST: {companySettings.gstNumber}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreviewPanel;
