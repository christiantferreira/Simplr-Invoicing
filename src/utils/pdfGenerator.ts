import { Invoice, Client, CompanySettings } from '@/types';

/**
 * Generates a PDF using the browser's print functionality
 * This ensures the PDF matches exactly what's shown when using Print to PDF
 */
export const generateInvoicePDF = async (
  invoice: Partial<Invoice>,
  client: Client | null,
  companySettings: CompanySettings | null
): Promise<void> => {
  try {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check your popup blocker settings.');
    }

    // Get the current page's CSS
    const stylesheets = Array.from(document.styleSheets);
    let cssText = '';
    
    // Extract CSS from stylesheets
    stylesheets.forEach(stylesheet => {
      try {
        if (stylesheet.cssRules) {
          Array.from(stylesheet.cssRules).forEach(rule => {
            cssText += rule.cssText + '\n';
          });
        }
      } catch (e) {
        // Handle CORS issues with external stylesheets
        console.warn('Could not access stylesheet:', e);
      }
    });

    // Get inline styles from the current document
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach(style => {
      cssText += style.innerHTML + '\n';
    });

    // Generate the invoice HTML using the same component structure
    const invoiceHTML = generateInvoiceHTML(invoice, client, companySettings);

    // Create the complete HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoiceNumber || 'INV-XXX'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          ${cssText}
          
          /* Additional print-specific styles */
          @media print {
            body {
              margin: 0;
              padding: 20px;
              background: white;
            }
            
            .invoice-content {
              box-shadow: none !important;
              border: none !important;
              margin: 0;
              padding: 0;
            }
            
            /* Ensure colors print correctly */
            .bg-simplr-primary {
              background-color: #2B0A66 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .bg-simplr-accent {
              background-color: #A77DFF !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .text-simplr-on-dark {
              color: white !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .text-simplr-primary {
              color: #2B0A66 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            /* Hide page margins */
            @page {
              margin: 0.5in;
            }
          }
          
          /* Screen styles for preview */
          @media screen {
            body {
              background: #f5f5f5;
              padding: 20px;
            }
            
            .invoice-content {
              max-width: 8.5in;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
        </style>
      </head>
      <body>
        ${invoiceHTML}
        <script>
          // Auto-print when the page loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    // Write the HTML to the new window
    printWindow.document.write(htmlContent);
    printWindow.document.close();

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

/**
 * Generates the HTML content for the invoice using the same structure as InvoicePreviewPanel
 */
function generateInvoiceHTML(
  invoice: Partial<Invoice>,
  client: Client | null,
  companySettings: CompanySettings | null
): string {
  if (!companySettings) {
    return '<div class="p-8 text-center text-gray-500">Loading preview...</div>';
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

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

  const style = templateStyles[invoice.templateId as keyof typeof templateStyles] || templateStyles.classic;

  // Generate items HTML
  const itemsHTML = invoice.items?.map((item, index) => `
    <tr class="border-b border-gray-100">
      <td class="py-3">
        <div class="font-medium">
          ${item.description || 'Item description'}
        </div>
      </td>
      <td class="py-3 text-center">${item.quantity}</td>
      <td class="py-3 text-right">${formatCurrency(item.unitPrice)}</td>
      <td class="py-3 text-right font-medium">${formatCurrency(item.total)}</td>
    </tr>
  `).join('') || `
    <tr>
      <td colspan="4" class="py-8 text-center text-gray-400">
        Add items to see them here
      </td>
    </tr>
  `;

  return `
    <div id="invoice-content" class="invoice-content bg-white border rounded-lg overflow-hidden shadow-sm">
      <!-- Header -->
      <div class="${style.headerBg} ${style.headerText} p-6">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold">INVOICE</h1>
            <p class="mt-1 opacity-90">
              #${invoice.invoiceNumber || 'INV-XXX'}
            </p>
          </div>
          <div class="text-right">
            <h2 class="text-xl font-semibold">
              ${companySettings.name === 'Company Name Not Set' ? 
                '<span class="text-gray-400 italic">Company Name Not Set</span>' : 
                companySettings.name
              }
            </h2>
            ${companySettings.address && companySettings.address !== 'Company Address Not Set' ? `
              <div class="mt-2 text-sm opacity-90">
                ${companySettings.address.split('\n').map(line => `<div>${line}</div>`).join('')}
              </div>
            ` : `
              <div class="mt-2 text-sm text-gray-400 italic opacity-90">Company Address Not Set</div>
            `}
            ${companySettings.phone && companySettings.phone !== 'Phone Number Not Set' ? `
              <div class="text-sm opacity-90 mt-1">${companySettings.phone}</div>
            ` : `
              <div class="text-sm text-gray-400 italic opacity-90 mt-1">Phone Number Not Set</div>
            `}
            ${companySettings.email && companySettings.email !== 'Email Not Set' ? `
              <div class="text-sm opacity-90">${companySettings.email}</div>
            ` : `
              <div class="text-sm text-gray-400 italic opacity-90">Email Not Set</div>
            `}
            ${companySettings.hasGST && companySettings.gstNumber ? `
              <div class="text-sm opacity-90 mt-1">GST: ${companySettings.gstNumber}</div>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- Bill To & Invoice Details -->
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 class="font-semibold ${style.accentColor} mb-3">Bill To:</h3>
            ${client ? `
              <div class="text-sm space-y-1">
                <div class="font-medium">${client.name}</div>
                ${client.company ? `<div>${client.company}</div>` : ''}
                ${client.address ? `
                  <div class="text-gray-600">
                    ${client.address.split('\n').map(line => `<div>${line}</div>`).join('')}
                  </div>
                ` : ''}
                <div class="text-gray-600">${client.email}</div>
                ${client.phone ? `<div class="text-gray-600">${client.phone}</div>` : ''}
                ${(client as any).hasGST && (client as any).gstNumber ? `
                  <div class="text-gray-600">GST: ${(client as any).gstNumber}</div>
                ` : ''}
              </div>
            ` : `
              <div class="text-gray-400 text-sm">Select a client</div>
            `}
          </div>
          <div>
            <h3 class="font-semibold ${style.accentColor} mb-3">Invoice Details:</h3>
            <div class="text-sm space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Issue Date:</span>
                <span>${invoice.issueDate ? formatDate(invoice.issueDate) : '-'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Due Date:</span>
                <span>${invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="mb-8">
          <table class="w-full">
            <thead>
              <tr class="${style.borderColor} border-b-2">
                <th class="text-left py-3 font-semibold">Description</th>
                <th class="text-center py-3 font-semibold w-20">Qty</th>
                <th class="text-right py-3 font-semibold w-24">Price</th>
                <th class="text-right py-3 font-semibold w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="flex justify-end">
          <div class="w-64 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            ${(invoice.discount || 0) > 0 ? `
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Discount:</span>
                <span>-${formatCurrency(invoice.discount || 0)}</span>
              </div>
            ` : ''}
            ${(invoice.tax || 0) > 0 ? `
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tax:</span>
                <span>${formatCurrency(invoice.tax || 0)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-lg font-semibold pt-2 border-t ${style.borderColor}">
              <span>Total:</span>
              <span class="${style.accentColor}">${formatCurrency(invoice.total || 0)}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        ${invoice.notes ? `
          <div class="mt-8 pt-6 border-t border-gray-200">
            <h3 class="font-semibold ${style.accentColor} mb-2">Notes:</h3>
            <div class="text-sm text-gray-600 whitespace-pre-wrap">
              ${invoice.notes}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
