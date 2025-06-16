import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendInvoiceEmailProps {
  to: string;
  subject: string;
  html: string;
}

const SendInvoiceEmail: React.FC<SendInvoiceEmailProps> = ({ to, subject, html }) => {
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: { to, subject, html },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Invoice sent successfully!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" value={to} readOnly />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} readOnly />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" value={html} readOnly rows={10} />
          </div>
          <Button onClick={handleSendEmail} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SendInvoiceEmail;
