
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInvoice } from '../contexts/InvoiceContext';
import { Invoice, Client } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  client: Client | null;
}

const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  client,
}) => {
  const { updateInvoice } = useInvoice();
  const [email, setEmail] = useState(client?.email || '');
  const [subject, setSubject] = useState(`Invoice ${invoice.invoiceNumber} from ${invoice.invoiceNumber}`);
  const [message, setMessage] = useState(
    `Dear ${client?.name || 'Client'},\n\nI hope this email finds you well. Please find attached invoice ${invoice.invoiceNumber} for the services provided.\n\nThe total amount due is ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(invoice.total)} and is due by ${format(new Date(invoice.dueDate), 'MMMM d, yyyy')}.\n\nPlease let me know if you have any questions.\n\nBest regards`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setSending(true);

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update invoice status
    const updatedInvoice = {
      ...invoice,
      status: 'sent' as const,
      sentAt: format(new Date(), 'yyyy-MM-dd'),
    };
    updateInvoice(updatedInvoice);

    toast.success(`Invoice sent successfully to ${email}`);
    setSending(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Invoice {invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">To Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@email.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Invoice subject"
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message to the client"
              rows={8}
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Invoice Summary:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Invoice: {invoice.invoiceNumber}</div>
              <div>Amount: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(invoice.total)}</div>
              <div>Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={sending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {sending ? 'Sending...' : 'Send Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendInvoiceModal;
