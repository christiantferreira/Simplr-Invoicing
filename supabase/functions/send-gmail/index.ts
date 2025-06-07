import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  htmlBody: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    mimeType: string;
  }>;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get('GMAIL_CLIENT_ID');
  const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return await response.json();
}

async function sendGmailMessage(accessToken: string, emailData: EmailRequest): Promise<void> {
  // Create the email message in RFC 2822 format
  let message = `To: ${emailData.to}\r\n`;
  message += `Subject: ${emailData.subject}\r\n`;
  message += `Content-Type: text/html; charset=utf-8\r\n`;
  message += `\r\n`;
  message += emailData.htmlBody;

  // If there are attachments, we need to create a multipart message
  if (emailData.attachments && emailData.attachments.length > 0) {
    const boundary = `boundary_${Date.now()}`;
    message = `To: ${emailData.to}\r\n`;
    message += `Subject: ${emailData.subject}\r\n`;
    message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
    message += `\r\n`;
    
    // HTML body part
    message += `--${boundary}\r\n`;
    message += `Content-Type: text/html; charset=utf-8\r\n`;
    message += `\r\n`;
    message += emailData.htmlBody;
    message += `\r\n`;
    
    // Attachment parts
    for (const attachment of emailData.attachments) {
      message += `--${boundary}\r\n`;
      message += `Content-Type: ${attachment.mimeType}\r\n`;
      message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
      message += `Content-Transfer-Encoding: base64\r\n`;
      message += `\r\n`;
      message += attachment.content;
      message += `\r\n`;
    }
    
    message += `--${boundary}--\r\n`;
  }

  // Encode the message in base64url format
  const encodedMessage = btoa(message)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse the request body
    const emailData: EmailRequest = await req.json();

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.htmlBody) {
      throw new Error('Missing required fields: to, subject, htmlBody');
    }

    // Get Gmail tokens for the user
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('gmail_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokensError || !tokens) {
      throw new Error('Gmail tokens not found. Please connect your Gmail account first.');
    }

    let accessToken = tokens.access_token;
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();

    // Check if token needs refresh (refresh 5 minutes before expiry)
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      console.log('Refreshing access token...');
      
      try {
        const refreshResult = await refreshAccessToken(tokens.refresh_token);
        accessToken = refreshResult.access_token;
        
        // Update the tokens in the database
        const newExpiresAt = new Date(now.getTime() + refreshResult.expires_in * 1000);
        await supabaseClient
          .from('gmail_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt.toISOString(),
          })
          .eq('user_id', user.id);
          
        console.log('Access token refreshed successfully');
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        throw new Error('Failed to refresh Gmail access token. Please reconnect your Gmail account.');
      }
    }

    // Send the email
    await sendGmailMessage(accessToken, emailData);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-gmail function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
})
