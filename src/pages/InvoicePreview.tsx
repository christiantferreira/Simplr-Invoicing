
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Send, Printer, Link as LinkIcon, Edit, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInvoice } from '@/contexts/InvoiceContext';
import InvoicePreviewPanel from '@/components/InvoicePreviewPanel';
import SendInvoiceModal from '@/components/SendInvoiceModal';
import { toast } from 'sonner';

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useInvoice();
  const [showSendModal, setShowSendModal] = useState(false);

  const invoice = state.invoices.find(inv => inv.id === id);
  const client = invoice ? state.clients.find(c => c.id === invoice.clientId) : null;

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    toast.success('PDF download will be implemented with a PDF library');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/invoices')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Invoice {invoice.invoiceNumber}
              </h1>
              <p className="text-sm text-gray-600">
                {client?.name} • {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(invoice.total)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button 
              onClick={() => setShowSendModal(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <InvoicePreviewPanel 
            invoice={invoice} 
            client={client}
            companySettings={state.companySettings}
          />
        </div>
      </div>

      <SendInvoiceModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        invoice={invoice}
        client={client}
      />
    </div>
  );
};

export default InvoicePreview;
