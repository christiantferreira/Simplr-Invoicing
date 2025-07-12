import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';

const checkGmailToken = async () => {
  const { data, error } = await supabase
    .from('gmail_tokens')
    .select('id')
    .limit(1)
    .single();
  return !!data && !error;
};

interface SendInvoiceModalProps {
  invoiceId: string;
  clientEmail: string;
  children: React.ReactNode; // To wrap the trigger button
}

const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({ invoiceId, clientEmail, children }) => {
  const [useGmail, setUseGmail] = useState(false);
  const { data: isGmailConnected } = useQuery({
    queryKey: ['gmail_token_status'],
    queryFn: checkGmailToken,
  });

  const handleSend = async () => {
    if (useGmail) {
      console.log(`Sending invoice ${invoiceId} to ${clientEmail} using Gmail.`);
      try {
        const { data, error } = await supabase.functions.invoke('send-gmail', {
          body: { 
            to: clientEmail, 
            subject: `Invoice from [Your Company]`, // Placeholder
            body: `Hi, please find your invoice attached.` // Placeholder
          },
        });
        if (error) throw error;
        console.log('Email sent successfully:', data);
        alert('Email sent successfully via Gmail!');
      } catch (error: any) {
        console.error('Failed to send email via Gmail:', error.message);
        alert(`Failed to send email: ${error.message}`);
      }
    } else {
      console.log(`Sending invoice ${invoiceId} to ${clientEmail} using default email service.`);
      // Placeholder for default email service
      alert("Default email service not implemented.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogDescription>
            Prepare the email to send the invoice. The PDF will be attached automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="to" className="text-right">
              To
            </Label>
            <Input id="to" defaultValue={clientEmail} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Input id="subject" defaultValue={`Invoice from [Your Company]`} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="body" className="text-right">
              Body
            </Label>
            <Textarea id="body" defaultValue={`Hi, please find your invoice attached.`} className="col-span-3" />
          </div>
          {isGmailConnected && (
            <div className="flex items-center space-x-2 justify-end col-span-4">
              <Checkbox id="use-gmail" checked={useGmail} onCheckedChange={(checked) => setUseGmail(!!checked)} />
              <Label htmlFor="use-gmail">Send using my Gmail account</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSend}>Send Email</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendInvoiceModal;
