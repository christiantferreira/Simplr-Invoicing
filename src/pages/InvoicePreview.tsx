import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Send, Printer, Link as LinkIcon, Edit, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseInvoices } from '@/hooks/useSupabaseInvoices';
import { useAuth } from '@/hooks/useAuth';
import InvoicePreviewPanel from '@/components/InvoicePreviewPanel';
import SendInvoiceModal from '@/components/SendInvoiceModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invoices, clients, loading, error, refetch } = useSupabaseInvoices();
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
        } else {
          // Create default company settings
          setCompanySettings({
            id: 'default',
            name: 'Your Company Name',
            address: 'Your Company Address',
            phone: 'Your Phone Number',
            email: 'your@email.com',
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981',
            hasGST: false,
            gstNumber: '',
          });
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
        // Use default settings if there's an error
        setCompanySettings({
          id: 'default',
          name: 'Your Company Name',
          address: 'Your Company Address',
          phone: 'Your Phone Number',
          email: 'your@email.com',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          hasGST: false,
          gstNumber: '',
        });
      }
    };

    loadCompanySettings();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to view invoices.</p>
          <Button onClick={() => navigate('/auth')}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Invoice</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => navigate('/invoices')}>
              Back to Invoices
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const invoice = invoices.find(inv => inv.id === id);
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600 mb-2">The invoice with ID "{id}" doesn't exist.</p>
          <p className="text-sm text-gray-500 mb-6">
            {invoices.length === 0 
              ? "No invoices found. Sample data will be created automatically."
              : `Available invoices: ${invoices.map(inv => inv.invoiceNumber).join(', ')}`
            }
          </p>
          <div className="space-x-4">
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={() => navigate('/invoices')}>
              Back to Invoices
            </Button>
            {invoices.length > 0 && (
              <Button onClick={() => navigate(`/invoices/${invoices[0].id}/preview`)}>
                View First Invoice
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    try {
      const pdf = new jsPDF();
      
      // Set up the PDF document
      pdf.setFontSize(20);
      pdf.text('INVOICE', 20, 30);
      
      // Invoice number
      pdf.setFontSize(12);
      pdf.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 45);
      
      // Company info
      if (companySettings) {
        pdf.setFontSize(14);
        pdf.text(companySettings.name, 120, 30);
        if (companySettings.address) {
          const addressLines = companySettings.address.split('\n');
          addressLines.forEach((line, index) => {
            pdf.setFontSize(10);
            pdf.text(line, 120, 40 + (index * 5));
          });
        }
        if (companySettings.email) {
          pdf.setFontSize(10);
          pdf.text(companySettings.email, 120, 55);
        }
        if (companySettings.phone) {
          pdf.setFontSize(10);
          pdf.text(companySettings.phone, 120, 60);
        }
      }
      
      // Client info
      if (client) {
        pdf.setFontSize(12);
        pdf.text('Bill To:', 20, 70);
        pdf.setFontSize(10);
        pdf.text(client.name, 20, 80);
        if (client.company) {
          pdf.text(client.company, 20, 85);
        }
        if (client.email) {
          pdf.text(client.email, 20, 90);
        }
        if (client.address) {
          const clientAddressLines = client.address.split('\n');
          clientAddressLines.forEach((line, index) => {
            pdf.text(line, 20, 95 + (index * 5));
          });
        }
      }
      
      // Invoice details
      pdf.setFontSize(10);
      pdf.text(`Issue Date: ${invoice.issueDate || '-'}`, 120, 80);
      pdf.text(`Due Date: ${invoice.dueDate || '-'}`, 120, 85);
      
      // Items table header
      const startY = 120;
      pdf.setFontSize(10);
      pdf.text('Description', 20, startY);
      pdf.text('Qty', 120, startY);
      pdf.text('Price', 140, startY);
      pdf.text('Total', 170, startY);
      
      // Draw line under header
      pdf.line(20, startY + 2, 190, startY + 2);
      
      // Items
      let currentY = startY + 10;
      if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach((item) => {
          pdf.text(item.description || '', 20, currentY);
          pdf.text(item.quantity.toString(), 120, currentY);
          pdf.text(`$${item.unitPrice.toFixed(2)}`, 140, currentY);
          pdf.text(`$${item.total.toFixed(2)}`, 170, currentY);
          currentY += 8;
        });
      }
      
      // Totals
      const totalsY = Math.max(currentY + 20, 200);
      pdf.text(`Subtotal: $${(invoice.subtotal || 0).toFixed(2)}`, 140, totalsY);
      if ((invoice.discount || 0) > 0) {
        pdf.text(`Discount: -$${(invoice.discount || 0).toFixed(2)}`, 140, totalsY + 8);
      }
      if ((invoice.tax || 0) > 0) {
        pdf.text(`Tax: $${(invoice.tax || 0).toFixed(2)}`, 140, totalsY + 16);
      }
      pdf.setFontSize(12);
      pdf.text(`Total: $${(invoice.total || 0).toFixed(2)}`, 140, totalsY + 24);
      
      // Notes
      if (invoice.notes) {
        pdf.setFontSize(10);
        pdf.text('Notes:', 20, totalsY + 40);
        const noteLines = pdf.splitTextToSize(invoice.notes, 170);
        pdf.text(noteLines, 20, totalsY + 48);
      }
      
      // Save the PDF
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
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
                {client?.name || 'Unknown Client'} • {new Intl.NumberFormat('en-US', {
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
