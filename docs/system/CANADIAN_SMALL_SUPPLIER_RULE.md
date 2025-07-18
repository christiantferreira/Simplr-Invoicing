# Canadian Small Supplier Rule - GST/HST Registration
## Critical Compliance Information for CPA Review

### Overview of the Small Supplier Rule

The **Small Supplier Rule** determines when a business must register for and collect GST/HST in Canada. This is a federal rule that applies across all provinces and territories.

### The $30,000 Threshold Rule

#### Basic Rule
- **Threshold**: $30,000 CAD in total revenue
- **Period**: Over 4 consecutive calendar quarters (12 months rolling)
- **Calculation**: Total worldwide revenue (not just Canadian sales)
- **Important**: This is based on revenue, NOT profit

#### How the Calculation Works

```typescript
// Example calculation logic
interface QuarterlyRevenue {
  quarter: string;  // e.g., "2024-Q1"
  revenue: number;  // Total revenue in CAD
}

function mustRegisterForGST(quarters: QuarterlyRevenue[]): {
  required: boolean;
  totalRevenue: number;
  effectiveDate?: Date;
} {
  // Check last 4 quarters on a rolling basis
  for (let i = 0; i <= quarters.length - 4; i++) {
    const fourQuarters = quarters.slice(i, i + 4);
    const total = fourQuarters.reduce((sum, q) => sum + q.revenue, 0);
    
    if (total > 30000) {
      // Registration required as of the END of the month 
      // FOLLOWING the month when threshold was exceeded
      return {
        required: true,
        totalRevenue: total,
        effectiveDate: calculateEffectiveDate(fourQuarters[3].quarter)
      };
    }
  }
  
  return { required: false, totalRevenue: 0 };
}
```

### Key Details of the Rule

#### 1. **When Registration Becomes Mandatory**
- You exceed $30,000 in any 4 consecutive quarters
- You must register by the end of the month AFTER you exceed the threshold
- You must start charging GST/HST from the effective date

**Example Timeline**:
- March 15, 2024: Total revenue over last 4 quarters hits $30,001
- March 31, 2024: End of month when threshold exceeded
- April 30, 2024: Deadline to register for GST/HST
- May 1, 2024: Must start collecting GST/HST

#### 2. **What Counts Toward the $30,000**
- ✅ All taxable supplies (goods and services)
- ✅ Zero-rated supplies (exports, basic groceries)
- ❌ Exempt supplies (certain financial services, health care)
- ❌ Sales of capital property
- ❌ Goodwill sales

#### 3. **Special Situations**

##### Associates Rule
If you have associated businesses, you must combine revenues:
```typescript
// All associated entities count together
const associatedRevenue = 
  businessA.revenue + 
  businessB.revenue + 
  businessC.revenue;

if (associatedRevenue > 30000) {
  // ALL associated businesses must register
}
```

##### Single Transaction Rule
- If you make a SINGLE taxable sale over $30,000, you must register immediately
- Registration required BEFORE completing the transaction

### Implementation in Simplr Invoicing

#### Database Schema Updates

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN 
  gst_registration_status VARCHAR(20) DEFAULT 'not_required'
  CHECK (gst_registration_status IN ('not_required', 'voluntary', 'required', 'registered'));

ALTER TABLE users ADD COLUMN 
  gst_registration_number VARCHAR(20);

ALTER TABLE users ADD COLUMN 
  gst_registration_date DATE;

ALTER TABLE users ADD COLUMN 
  small_supplier_threshold_date DATE;

-- Revenue tracking table for GST threshold
CREATE TABLE revenue_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter IN (1,2,3,4)),
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  taxable_revenue_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, quarter)
);

-- Automated revenue tracking
CREATE OR REPLACE FUNCTION update_revenue_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track for Canadian users
  IF (SELECT country FROM users WHERE id = NEW.user_id) = 'CA' THEN
    INSERT INTO revenue_tracking (
      user_id,
      year,
      quarter,
      revenue_cents,
      taxable_revenue_cents
    )
    VALUES (
      NEW.user_id,
      EXTRACT(YEAR FROM NEW.issue_date),
      EXTRACT(QUARTER FROM NEW.issue_date),
      NEW.total_cents,
      NEW.subtotal_cents  -- Assuming subtotal is taxable amount
    )
    ON CONFLICT (user_id, year, quarter) 
    DO UPDATE SET
      revenue_cents = revenue_tracking.revenue_cents + NEW.total_cents,
      taxable_revenue_cents = revenue_tracking.taxable_revenue_cents + NEW.subtotal_cents,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_revenue_for_gst
  AFTER INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.status = 'issued')
  EXECUTE FUNCTION update_revenue_tracking();
```

#### Business Logic Implementation

```typescript
export class GSTRegistrationService {
  
  async checkRegistrationRequirement(userId: string): Promise<{
    required: boolean;
    currentStatus: 'not_required' | 'approaching' | 'must_register' | 'registered';
    fourQuarterTotal: Money;
    registrationDeadline?: Date;
    warnings: string[];
  }> {
    const user = await this.getUser(userId);
    
    // Already registered
    if (user.gst_registration_number) {
      return {
        required: true,
        currentStatus: 'registered',
        fourQuarterTotal: new Money(0, 'CAD'),
        warnings: []
      };
    }
    
    // Get last 4 quarters of revenue
    const quarters = await this.getQuarterlyRevenue(userId);
    const total = this.calculateRollingTotal(quarters);
    
    // Check single transaction rule
    const largeSingleTransaction = await this.checkSingleTransactionOver30k(userId);
    
    if (largeSingleTransaction) {
      return {
        required: true,
        currentStatus: 'must_register',
        fourQuarterTotal: total,
        registrationDeadline: new Date(), // Immediate
        warnings: ['Single transaction over $30,000 - registration required immediately']
      };
    }
    
    // Check rolling 4-quarter total
    if (total.amount >= 30000) {
      const deadline = this.calculateRegistrationDeadline(quarters);
      return {
        required: true,
        currentStatus: 'must_register',
        fourQuarterTotal: total,
        registrationDeadline: deadline,
        warnings: [`You must register for GST/HST by ${deadline.toDateString()}`]
      };
    }
    
    // Warning zone (80% of threshold)
    if (total.amount >= 24000) {
      return {
        required: false,
        currentStatus: 'approaching',
        fourQuarterTotal: total,
        warnings: [`Approaching GST registration threshold: $${total.toString()} of $30,000`]
      };
    }
    
    return {
      required: false,
      currentStatus: 'not_required',
      fourQuarterTotal: total,
      warnings: []
    };
  }
  
  private calculateRegistrationDeadline(quarters: QuarterlyRevenue[]): Date {
    // Find when threshold was exceeded
    let exceededDate: Date | null = null;
    
    for (let i = 0; i <= quarters.length - 4; i++) {
      const fourQuarters = quarters.slice(i, i + 4);
      const total = fourQuarters.reduce((sum, q) => sum + q.revenue, 0);
      
      if (total > 30000 && !exceededDate) {
        // Get the last day of the quarter when exceeded
        exceededDate = this.getQuarterEndDate(fourQuarters[3]);
        break;
      }
    }
    
    if (!exceededDate) return new Date();
    
    // Registration deadline is end of month following the month of exceeding
    const deadline = new Date(exceededDate);
    deadline.setMonth(deadline.getMonth() + 2);
    deadline.setDate(0); // Last day of previous month
    
    return deadline;
  }
}
```

### Tax Collection Logic When Not Registered

```typescript
export class CanadianTaxCalculator {
  
  async calculateTax(invoice: InvoiceData, user: User): Promise<TaxCalculation> {
    // Check if user should collect GST/HST
    const gstStatus = await this.gstService.checkRegistrationRequirement(user.id);
    
    if (user.country !== 'CA') {
      // Non-Canadian users follow different rules
      return this.calculateNonCanadianTax(invoice);
    }
    
    // Small supplier (not registered) - NO GST/HST collection
    if (gstStatus.currentStatus === 'not_required') {
      return {
        taxes: [],
        totalTax: new Money(0, 'CAD'),
        warnings: ['GST/HST not charged - small supplier'],
        displayNote: 'GST/HST not applicable - small supplier'
      };
    }
    
    // Must register but hasn't yet - WARNING but no tax
    if (gstStatus.currentStatus === 'must_register' && !user.gst_registration_number) {
      return {
        taxes: [],
        totalTax: new Money(0, 'CAD'),
        warnings: [
          'WARNING: You must register for GST/HST',
          `Registration deadline: ${gstStatus.registrationDeadline}`,
          'You cannot charge GST/HST until registered'
        ],
        displayNote: 'GST/HST not applicable - registration pending'
      };
    }
    
    // Registered - must collect GST/HST
    if (user.gst_registration_number) {
      return this.calculateRegisteredBusinessTax(invoice, user);
    }
  }
}
```

### Invoice Display for Small Suppliers

#### Before Registration (Small Supplier)
```
Invoice #2024-001

Services Rendered             $1,000.00
----------------------------------------
Subtotal:                    $1,000.00
GST/HST:                   Not applicable
                          (Small supplier)
----------------------------------------
Total:                       $1,000.00
```

#### After Registration Required
```
Invoice #2024-050

Services Rendered             $1,000.00
----------------------------------------
Subtotal:                    $1,000.00
HST (13%):                     $130.00
----------------------------------------
Total:                       $1,130.00

GST/HST Registration #: 123456789 RT0001
```

### Important Considerations

#### 1. **Voluntary Registration**
- Businesses can register voluntarily even if under $30,000
- Benefits: Can claim input tax credits
- Drawbacks: Must charge GST/HST on all sales

#### 2. **Provincial Sales Tax (PST)**
- Small supplier rule ONLY applies to GST/HST
- PST may still be required based on provincial rules
- Each province has different PST registration thresholds

#### 3. **International Sales**
- Exports are zero-rated (0% GST but counts toward threshold)
- Digital services to non-residents may have special rules

### Implementation Warnings for Simplr Invoicing

```typescript
// Critical warnings to implement
export const GST_WARNINGS = {
  APPROACHING_THRESHOLD: "You're approaching the $30,000 GST/HST registration threshold",
  EXCEEDED_THRESHOLD: "You've exceeded $30,000 - GST/HST registration required",
  SINGLE_LARGE_TRANSACTION: "This transaction requires immediate GST/HST registration",
  NOT_REGISTERED_CANT_CHARGE: "You cannot charge GST/HST without a registration number",
  VOLUNTARY_REGISTRATION: "Consider voluntary GST/HST registration to claim input tax credits"
};

// User notifications
export class GSTNotificationService {
  async checkAndNotify(userId: string): Promise<void> {
    const status = await this.gstService.checkRegistrationRequirement(userId);
    
    switch (status.currentStatus) {
      case 'approaching':
        await this.sendNotification(userId, {
          type: 'warning',
          title: 'Approaching GST/HST Threshold',
          message: `Current 4-quarter revenue: ${status.fourQuarterTotal}`,
          action: 'Learn about GST registration'
        });
        break;
        
      case 'must_register':
        await this.sendNotification(userId, {
          type: 'urgent',
          title: 'GST/HST Registration Required',
          message: `Deadline: ${status.registrationDeadline}`,
          action: 'Register now'
        });
        break;
    }
  }
}
```

### Testing Scenarios

1. **Below Threshold**
   - User with $25,000 revenue over 4 quarters
   - Should NOT charge GST/HST
   - Should see "small supplier" on invoices

2. **Crossing Threshold**
   - User hits $30,001 in March
   - Gets warning about registration deadline (April 30)
   - Cannot charge GST until registered

3. **Large Single Transaction**
   - User with $5,000 previous revenue
   - Creates $35,000 invoice
   - Must register BEFORE completing sale

---

**NOTE FOR CPA REVIEW**: Please verify this interpretation of the small supplier rule. Key questions:
1. Is the $30,000 calculation method correct?
2. Are the registration deadlines accurate?
3. Should we track worldwide revenue or just Canadian revenue?
4. How should we handle associated entities?
5. Are there any province-specific variations?
