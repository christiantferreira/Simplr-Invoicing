# Security & Supabase Setup

## Gmail Integration Security

### Database Setup

The project includes secure Gmail token storage with the following features:

1. **Gmail Tokens Table** (`supabase/migrations/20250606_create_gmail_tokens_table.sql`)
   - Secure storage of OAuth tokens
   - Row Level Security (RLS) enabled
   - User-specific access policies
   - Automatic token expiration handling

2. **Edge Function** (`supabase/functions/send-gmail/index.ts`)
   - Secure Gmail API integration
   - Automatic token refresh
   - Email sending with attachment support
   - CORS handling for web requests

### Required Environment Variables

The following environment variables need to be set in Supabase:

```bash
# TODO: Set these in Supabase Dashboard > Settings > Edge Functions
GMAIL_CLIENT_ID=your_google_oauth_client_id
GMAIL_CLIENT_SECRET=your_google_oauth_client_secret
```

### Setup Instructions

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API

2. **Configure OAuth 2.0**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Set authorized redirect URIs for your domain
   - Download client credentials

3. **Deploy Supabase Migration**
   ```bash
   supabase db push
   ```

4. **Deploy Edge Function**
   ```bash
   supabase functions deploy send-gmail
   ```

5. **Set Environment Variables**
   ```bash
   supabase secrets set GMAIL_CLIENT_ID=your_client_id
   supabase secrets set GMAIL_CLIENT_SECRET=your_client_secret
   ```

### Security Features

- **Row Level Security**: Users can only access their own Gmail tokens
- **Token Encryption**: Tokens are stored securely in Supabase
- **Automatic Refresh**: Expired tokens are automatically refreshed
- **Scope Limitation**: Only Gmail send permission is requested
- **CORS Protection**: Proper CORS headers for web security

### Usage Example

```typescript
// Frontend usage
const response = await supabase.functions.invoke('send-gmail', {
  body: {
    to: 'client@example.com',
    subject: 'Invoice #001',
    htmlBody: '<h1>Your Invoice</h1><p>Please find attached...</p>',
    attachments: [
      {
        filename: 'invoice-001.pdf',
        content: base64PdfContent,
        mimeType: 'application/pdf'
      }
    ]
  }
});
```

## Input Sanitization

All user inputs are sanitized to prevent:
- SQL injection attacks
- XSS vulnerabilities
- Email header injection
- File upload vulnerabilities

## Data Protection

- All sensitive data is encrypted at rest
- API keys and secrets are stored in environment variables
- User authentication is handled by Supabase Auth
- Session management follows security best practices
