import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

const checkGmailToken = async () => {
  // In a real app, this would check against the current user's ID.
  // For now, we just check if any token exists for simplicity.
  const { data, error } = await supabase
    .from('gmail_tokens')
    .select('id')
    .limit(1)
    .single();
  
  return !!data && !error;
};

const GmailIntegration: React.FC = () => {
  const { data: isConnected, isLoading } = useQuery({
    queryKey: ['gmail_token_status'],
    queryFn: checkGmailToken,
  });

  const handleConnect = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.send',
        redirectTo: window.location.href, // Redirect back to the same page
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  const handleDisconnect = async () => {
    // This would involve deleting the token from the 'gmail_tokens' table
    // and possibly revoking the token with Google.
    alert("Disconnect logic not implemented yet.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gmail Integration</CardTitle>
        <CardDescription>
          Connect your Gmail account to send invoices directly from your own email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        {isLoading ? (
          <p>Loading status...</p>
        ) : isConnected ? (
          <>
            <Badge variant="default">Connected</Badge>
            <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
          </>
        ) : (
          <>
            <Badge variant="secondary">Not Connected</Badge>
            <Button onClick={handleConnect}>Connect with Google</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GmailIntegration;
