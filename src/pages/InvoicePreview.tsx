
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Send, Printer, Link as LinkIcon, Edit, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseInvoices } from '@/hooks/useSupabaseInvoices';
import { useAuth } from '@/hooks/useAuth';
import InvoicePreviewPanel from '@/components/InvoicePreviewPanel';
import SendInvoiceModal from '@/components/SendInvoiceModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invoices, clients, loading } = useSupabaseInvoices();
  const [showSendModal, setShowSendModal] = useState(false);
  const [companySettings, setCompanySettings] = useState(null);

  // Load company settings
  React.useEffect(() => {
    const loadCompanySettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('company_info')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setCompanySettings({
            id: data.id,
            name: data.company_name || '',
            address: data.address || '',
            phone: data.phone_number || '',
            email: data.email || '',
            primaryColor: data.primary_color || '#3B82F6',
            secondaryColor: data.secondary_color || '#10B981',
            hasGST: !!data.gst_number,
            gstNumber: data.gst_number || '',
          });
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    };

    loadCompanySettings();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const invoice = invoices.find(inv => inv.id === id);
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

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
            companySettings={companySettings}
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
