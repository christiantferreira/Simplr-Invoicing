# Simplified Compliant Architecture for Simplr Invoicing

## Project Scope Clarification
- **Target Users**: Small businesses in USA and Canada (B2C via App/Play Store)
- **Core Features**: Create invoices, calculate taxes, send via email, track status, download PDF
- **No Integration**: Standalone app, no accounting system integration
- **CPA Oversight**: Tax logic reviewed by CPAs before implementation

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Mobile Apps                       │
│        React Native (iOS & Android)                 │
└────────────────────┬───────────────────────────────┘
                     │ HTTPS
┌────────────────────┴───────────────────────────────┐
│                  Supabase Backend                   │
├─────────────────────────────────────────────────────┤
│  • PostgreSQL (Financial-grade schema)              │
│  • Row Level Security (User isolation)              │
│  • Edge Functions (Tax calculations)                │
│  • Storage (Logo uploads, PDF storage)              │
│  • Auth (Email/password + 2FA required)             │
└─────────────────────────────────────────────────────┘
                     │
┌────────────────────┴───────────────────────────────┐
│              External Services                      │
├─────────────────────────────────────────────────────┤
│  • SendGrid (Email delivery with tracking)          │
│  • PDF Generation Service (or React Native PDF)     │
│  • Tax Rate API (Optional: TaxJar/Avalara)         │
└─────────────────────────────────────────────────────┘
```

## Core Implementation Principles

### 1. Financial Data Integrity

```typescript
// CRITICAL: Use decimal arithmetic for all money calculations
import { Decimal } from 'decimal.js';

// Configure Decimal for financial calculations
Decimal.set({ 
  precision: 10,      // More than enough for money
  rounding: Decimal.ROUND_HALF_UP  // Standard financial rounding
});

export class Money {
  private amount: Decimal;
  private currency: 'USD' | 'CAD';
  
  constructor(amount: string | number, currency: 'USD' | 'CAD') {
    this.amount = new Decimal(amount);
    this.currency = currency;
  }
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount.plus(other.amount).toString(), this.currency);
  }
  
  multiply(factor: number): Money {
    return new Money(this.amount.times(factor).toString(), this.currency);
  }
  
  toString(): string {
    return this.amount.toFixed(2);
  }
  
  toCents(): number {
    return this.amount.times(100).toNumber();
  }
}
```

### 2. Database Schema (Compliant & Auditable)

```sql
-- Users table (enhanced for compliance)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_address JSONB NOT NULL,
  country VARCHAR(2) NOT NULL CHECK (country IN ('US', 'CA')),
  tax_registration_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ NOT NULL,
  terms_version VARCHAR(10) NOT NULL
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  address JSONB,
  tax_exempt BOOLEAN DEFAULT FALSE,
  tax_exempt_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Invoices table (immutable after issue)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  invoice_number TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'issued', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  
  -- Financial data (stored as integers - cents/pennies)
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  total_tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'CAD')),
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate invoice numbers per user
  UNIQUE(user_id, invoice_number)
);

-- Invoice items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  sort_order INTEGER NOT NULL
);

-- Tax breakdown (critical for compliance)
CREATE TABLE invoice_taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  tax_name TEXT NOT NULL, -- 'GST', 'PST', 'CA State Tax', etc.
  tax_rate DECIMAL(6,4) NOT NULL,
  taxable_amount_cents INTEGER NOT NULL,
  tax_amount_cents INTEGER NOT NULL,
  jurisdiction TEXT NOT NULL -- 'Federal', 'Ontario', 'California', etc.
);

-- Audit log (required for financial compliance)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status transition log (track invoice lifecycle)
CREATE TABLE invoice_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

-- Prevent editing issued invoices
CREATE OR REPLACE FUNCTION prevent_issued_invoice_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('issued', 'sent', 'viewed', 'paid') AND
     OLD.status = NEW.status AND
     (OLD.subtotal_cents != NEW.subtotal_cents OR
      OLD.total_tax_cents != NEW.total_tax_cents OR
      OLD.total_cents != NEW.total_cents) THEN
    RAISE EXCEPTION 'Cannot modify financial data on issued invoice';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_invoice_immutability
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_issued_invoice_edit();
```

### 3. Tax Calculation Service

```typescript
// Tax calculation with full audit trail
export class TaxCalculationService {
  
  async calculateCanadianTax(params: {
    province: string;
    subtotal: Money;
    items: InvoiceItem[];
    taxExempt: boolean;
  }): Promise<TaxCalculationResult> {
    
    // Use lookup table for rates
    const rates = this.getCanadianTaxRates(params.province);
    const calculations: TaxLineItem[] = [];
    
    if (params.taxExempt) {
      return { calculations, totalTax: new Money(0, 'CAD') };
    }
    
    // Calculate GST/HST
    if (rates.hst) {
      calculations.push({
        name: 'HST',
        rate: rates.hst,
        amount: params.subtotal.multiply(rates.hst),
        jurisdiction: 'Federal + Provincial'
      });
    } else {
      // GST
      calculations.push({
        name: 'GST',
        rate: rates.gst,
        amount: params.subtotal.multiply(rates.gst),
        jurisdiction: 'Federal'
      });
      
      // PST if applicable
      if (rates.pst) {
        calculations.push({
          name: 'PST',
          rate: rates.pst,
          amount: params.subtotal.multiply(rates.pst),
          jurisdiction: params.province
        });
      }
      
      // QST (Quebec) - compound tax
      if (rates.qst && params.province === 'QC') {
        const gstAmount = params.subtotal.multiply(rates.gst);
        const qstBase = params.subtotal.add(gstAmount);
        calculations.push({
          name: 'QST',
          rate: rates.qst,
          amount: qstBase.multiply(rates.qst),
          jurisdiction: 'Quebec'
        });
      }
    }
    
    const totalTax = calculations.reduce(
      (sum, calc) => sum.add(calc.amount),
      new Money(0, 'CAD')
    );
    
    return { calculations, totalTax };
  }
  
  async calculateUSTax(params: {
    fromState: string;
    fromZip: string;
    toState: string;
    toZip: string;
    subtotal: Money;
    hasNexus: boolean;
  }): Promise<TaxCalculationResult> {
    
    // No tax if no nexus
    if (!params.hasNexus) {
      return { 
        calculations: [], 
        totalTax: new Money(0, 'USD'),
        warning: 'No nexus in destination state - no tax collected'
      };
    }
    
    // For MVP, use state-level rates only
    const stateRate = this.getUSStateTaxRate(params.toState);
    
    if (stateRate === 0) {
      return { 
        calculations: [], 
        totalTax: new Money(0, 'USD'),
        note: 'No state sales tax in ' + params.toState
      };
    }
    
    const calculations: TaxLineItem[] = [{
      name: `${params.toState} State Tax`,
      rate: stateRate,
      amount: params.subtotal.multiply(stateRate),
      jurisdiction: params.toState
    }];
    
    return {
      calculations,
      totalTax: calculations[0].amount,
      note: 'Local taxes may apply - consult tax professional'
    };
  }
  
  // Tax rate tables (to be updated quarterly)
  private getCanadianTaxRates(province: string) {
    const rates: Record<string, any> = {
      'ON': { hst: 0.13 },
      'BC': { gst: 0.05, pst: 0.07 },
      'AB': { gst: 0.05 },
      'SK': { gst: 0.05, pst: 0.06 },
      'MB': { gst: 0.05, pst: 0.07 },
      'QC': { gst: 0.05, qst: 0.09975 },
      'NB': { hst: 0.15 },
      'NS': { hst: 0.15 },
      'PE': { hst: 0.15 },
      'NL': { hst: 0.15 },
      'NT': { gst: 0.05 },
      'YT': { gst: 0.05 },
      'NU': { gst: 0.05 }
    };
    
    return rates[province] || { gst: 0.05 };
  }
  
  private getUSStateTaxRate(state: string): number {
    // Simplified state rates for MVP
    const rates: Record<string, number> = {
      'AL': 0.04, 'AK': 0, 'AZ': 0.056, 'AR': 0.065, 'CA': 0.0725,
      'CO': 0.029, 'CT': 0.0635, 'DE': 0, 'FL': 0.06, 'GA': 0.04,
      'HI': 0.04, 'ID': 0.06, 'IL': 0.0625, 'IN': 0.07, 'IA': 0.06,
      'KS': 0.065, 'KY': 0.06, 'LA': 0.0445, 'ME': 0.055, 'MD': 0.06,
      'MA': 0.0625, 'MI': 0.06, 'MN': 0.06875, 'MS': 0.07, 'MO': 0.04225,
      'MT': 0, 'NE': 0.055, 'NV': 0.0685, 'NH': 0, 'NJ': 0.06625,
      'NM': 0.04875, 'NY': 0.04, 'NC': 0.0475, 'ND': 0.05, 'OH': 0.0575,
      'OK': 0.045, 'OR': 0, 'PA': 0.06, 'RI': 0.07, 'SC': 0.06,
      'SD': 0.042, 'TN': 0.07, 'TX': 0.0625, 'UT': 0.0485, 'VT': 0.06,
      'VA': 0.053, 'WA': 0.065, 'WV': 0.06, 'WI': 0.05, 'WY': 0.04,
      'DC': 0.06
    };
    
    return rates[state] || 0;
  }
}
```

### 4. Security Implementation

```typescript
// Required security measures
export const securityConfig = {
  // 1. Mandatory 2FA for all users
  auth: {
    require2FA: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    passwordRequirements: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    }
  },
  
  // 2. Rate limiting
  rateLimits: {
    invoiceCreation: '50 per hour per user',
    pdfGeneration: '100 per hour per user',
    emailSending: '20 per hour per user',
    authAttempts: '5 per 15 minutes per IP'
  },
  
  // 3. Data encryption
  encryption: {
    atRest: 'AES-256',
    inTransit: 'TLS 1.3',
    sensitiveFields: ['tax_registration_number', 'bank_account']
  }
};

// Audit every action
export async function auditLog(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  request?: any
) {
  await supabase.from('audit_log').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_values: oldValues,
    new_values: newValues,
    ip_address: request?.ip,
    user_agent: request?.headers['user-agent'],
    created_at: new Date().toISOString()
  });
}
```

### 5. Invoice Lifecycle Management

```typescript
// Invoice state machine
export class InvoiceStateMachine {
  private validTransitions = {
    'draft': ['issued', 'cancelled'],
    'issued': ['sent', 'cancelled'],
    'sent': ['viewed', 'paid', 'overdue', 'cancelled'],
    'viewed': ['paid', 'overdue', 'cancelled'],
    'overdue': ['paid', 'cancelled'],
    'paid': [],  // Terminal state
    'cancelled': []  // Terminal state
  };
  
  async transitionStatus(
    invoiceId: string,
    newStatus: InvoiceStatus,
    userId: string,
    reason?: string
  ): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);
    
    if (!this.validTransitions[invoice.status]?.includes(newStatus)) {
      throw new Error(`Invalid transition from ${invoice.status} to ${newStatus}`);
    }
    
    // Begin transaction
    await supabase.rpc('begin_transaction');
    
    try {
      // Update invoice
      await supabase
        .from('invoices')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'sent' && { sent_at: new Date().toISOString() }),
          ...(newStatus === 'viewed' && { viewed_at: new Date().toISOString() }),
          ...(newStatus === 'paid' && { paid_at: new Date().toISOString() })
        })
        .eq('id', invoiceId);
      
      // Log transition
      await supabase.from('invoice_status_log').insert({
        invoice_id: invoiceId,
        old_status: invoice.status,
        new_status: newStatus,
        changed_by: userId,
        reason
      });
      
      // Audit log
      await auditLog(userId, 'status_change', 'invoice', invoiceId, 
        { status: invoice.status }, 
        { status: newStatus }
      );
      
      await supabase.rpc('commit_transaction');
    } catch (error) {
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  }
}
```

### 6. PDF Generation (Legally Compliant)

```typescript
export class InvoicePDFGenerator {
  async generatePDF(invoice: Invoice): Promise<Buffer> {
    // Use React Native PDF or server-side generation
    const doc = new PDFDocument();
    
    // Header with business info
    doc.fontSize(20).text(invoice.businessName);
    doc.fontSize(10).text(invoice.businessAddress);
    if (invoice.taxRegistrationNumber) {
      doc.text(`Tax Registration: ${invoice.taxRegistrationNumber}`);
    }
    
    // Invoice details
    doc.moveDown();
    doc.fontSize(16).text(`Invoice #${invoice.invoiceNumber}`);
    doc.fontSize(10);
    doc.text(`Issue Date: ${invoice.issueDate}`);
    doc.text(`Due Date: ${invoice.dueDate}`);
    doc.text(`Status: ${invoice.status.toUpperCase()}`);
    
    // Watermark for status
    if (invoice.status === 'paid') {
      doc.fontSize(60)
         .fillOpacity(0.2)
         .text('PAID', 100, 400, { angle: 45 });
    } else if (invoice.status === 'cancelled') {
      doc.fontSize(60)
         .fillOpacity(0.2)
         .text('CANCELLED', 100, 400, { angle: 45 });
    }
    
    // Line items
    // ... (table generation code)
    
    // Tax breakdown (critical for compliance)
    doc.moveDown();
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal)}`);
    
    for (const tax of invoice.taxBreakdown) {
      doc.text(`${tax.name} (${tax.rate * 100}%): ${formatMoney(tax.amount)}`);
    }
    
    doc.fontSize(12).text(`Total: ${formatMoney(invoice.total)}`);
    
    // Footer disclaimers
    doc.moveDown();
    doc.fontSize(8).text('Tax calculations are provided for reference. Please verify with your tax professional.');
    
    return doc;
  }
}
```

### 7. Email Service Integration

```typescript
export class EmailService {
  private sendgrid: SendGridClient;
  
  async sendInvoice(invoice: Invoice, recipientEmail: string): Promise<void> {
    // Generate PDF
    const pdf = await this.pdfGenerator.generatePDF(invoice);
    
    // Create email
    const msg = {
      to: recipientEmail,
      from: {
        email: 'noreply@simplrinvoicing.com',
        name: invoice.businessName
      },
      subject: `Invoice #${invoice.invoiceNumber} from ${invoice.businessName}`,
      text: this.generatePlainText(invoice),
      html: this.generateHTML(invoice),
      attachments: [{
        content: pdf.toString('base64'),
        filename: `invoice_${invoice.invoiceNumber}.pdf`,
        type: 'application/pdf'
      }],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true }
      }
    };
    
    // Send and track
    const response = await this.sendgrid.send(msg);
    
    // Update invoice status
    await this.invoiceService.transitionStatus(
      invoice.id, 
      'sent', 
      invoice.userId
    );
    
    // Log email event
    await this.logEmailEvent(invoice.id, 'sent', response.messageId);
  }
}
```

## Mobile App Considerations

### React Native Architecture

```typescript
// Shared business logic package
packages/
  core/
    - Money.ts          // Decimal arithmetic
    - TaxCalculator.ts  // Tax logic
    - validators.ts     // Zod schemas
  
// Mobile-specific implementation
apps/mobile/
  src/
    screens/
      - InvoiceCreate.tsx
      - InvoiceList.tsx
      - TaxSettings.tsx
    components/
      - TaxCalculator.tsx  // UI for tax calculation
      - InvoicePreview.tsx
    services/
      - OfflineQueue.ts    // Handle offline invoice creation
```

### Offline Support

```typescript
export class OfflineInvoiceQueue {
  async queueInvoice(invoiceData: CreateInvoiceData): Promise<void> {
    // Store in encrypted local storage
    await AsyncStorage.setItem(
      `pending_invoice_${Date.now()}`,
      await this.encrypt(JSON.stringify(invoiceData))
    );
    
    // Set sync flag
    await AsyncStorage.setItem('has_pending_invoices', 'true');
  }
  
  async syncPendingInvoices(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const pendingKeys = keys.filter(k => k.startsWith('pending_invoice_'));
    
    for (const key of pendingKeys) {
      try {
        const encrypted = await AsyncStorage.getItem(key);
        const data = JSON.parse(await this.decrypt(encrypted));
        
        // Create invoice
        await this.invoiceService.create(data);
        
        // Remove from queue
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to sync invoice:', error);
        // Keep in queue for retry
      }
    }
  }
}
```

## Compliance Checklist

### Before Launch
- [ ] CPA review of all tax calculations
- [ ] Legal review of Terms of Service
- [ ] Privacy Policy (GDPR/CCPA compliant)
- [ ] Data Processing Agreement templates
- [ ] Audit logging tested
- [ ] 2FA mandatory for all users
- [ ] Invoice immutability verified
- [ ] Decimal arithmetic throughout
- [ ] SSL/TLS properly configured
- [ ] Rate limiting implemented

### Business Requirements
- [ ] Business insurance (E&O)
- [ ] Entity formation (LLC/Corp)
- [ ] Terms include liability limitations
- [ ] Clear tax calculation disclaimers
- [ ] Customer support process
- [ ] Data breach response plan

## MVP Launch Strategy

### Phase 1: Canada Only (Simpler)
1. Launch with Canadian tax only
2. All 13 provinces/territories
3. GST/HST/PST/QST support
4. French language support (Quebec)

### Phase 2: Add USA
1. State-level tax only initially
2. Major metros (top 50 cities)
3. Nexus wizard for users
4. Disclaimer about local taxes

### Phase 3: Enhancement
1. US county/city taxes
2. Tax API integration
3. Multi-currency
4. Recurring invoices

## Cost Structure (Realistic)

### Development
- Initial build: $150,000 - $200,000
- Annual maintenance: $50,000
- Tax updates: $20,000/year

### Operations
- Supabase: $599/month (Pro)
- SendGrid: $89/month
- SSL Certificate: $200/year
- App Store fees: $99/year (Apple) + $25 (Google)

### Professional Services
- CPA consultation: $5,000
- Legal review: $10,000
- Security audit: $15,000
- Insurance: $5,000/year

**Total Year 1**: ~$250,000

This architecture provides a **legally compliant, financially accurate** invoicing system while keeping complexity manageable. The focus on Canadian + US markets with CPA oversight significantly reduces risk while still providing value to small businesses.
