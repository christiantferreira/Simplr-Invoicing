import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Invoice, Client, CompanySettings } from '@/types';

import { UserOptions } from 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
  lastAutoTable: {
    finalY: number;
  };
}

export const generateInvoicePdf = (invoice: Invoice, client: Client, companySettings: CompanySettings) => {
  const doc = new jsPDF();

  // Add header
  doc.setFontSize(20);
  doc.setTextColor(companySettings.primaryColor);
  doc.text(companySettings.name, 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(companySettings.address || '', 14, 30);
  doc.text(companySettings.phone || '', 14, 35);
  doc.text(companySettings.email || '', 14, 40);

  doc.setFontSize(18);
  doc.text('INVOICE', 190, 22, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`# ${invoice.invoice_number}`, 190, 30, { align: 'right' });

  // Add client info
  doc.setFontSize(12);
  doc.text('Bill To:', 14, 60);
  doc.setFontSize(10);
  doc.text(client.name, 14, 66);
  doc.text(client.address || '', 14, 71);
  doc.text(client.email, 14, 76);

  // Add invoice info
  doc.setFontSize(10);
  doc.text(`Issue Date: ${invoice.issue_date}`, 190, 66, { align: 'right' });
  doc.text(`Due Date: ${invoice.due_date}`, 190, 71, { align: 'right' });

  // Add table
  const tableData = invoice.items?.map(item => [
    item.description,
    item.quantity,
    `$${item.unit_price.toFixed(2)}`,
    `$${item.total.toFixed(2)}`,
  ]) || [];

  doc.autoTable({
    startY: 85,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: companySettings.primaryColor,
    },
  });

  // Add totals
  const finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(10);
  doc.text('Subtotal:', 140, finalY + 10);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 190, finalY + 10, { align: 'right' });
  doc.text('Discount:', 140, finalY + 15);
  doc.text(`-$${invoice.discount.toFixed(2)}`, 190, finalY + 15, { align: 'right' });
  doc.text('Tax:', 140, finalY + 20);
  doc.text(`$${invoice.tax.toFixed(2)}`, 190, finalY + 20, { align: 'right' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 140, finalY + 25);
  doc.text(`$${invoice.total.toFixed(2)}`, 190, finalY + 25, { align: 'right' });

  // Add notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Notes:', 14, finalY + 40);
    doc.text(invoice.notes, 14, finalY + 45, { maxWidth: 180 });
  }

  // Save PDF
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
};
