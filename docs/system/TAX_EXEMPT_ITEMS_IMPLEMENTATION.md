# Tax-Exempt Items Implementation
## Handling Product/Service Tax Exemptions in USA & Canada

### Overview
Both Canada and the USA have complex rules about which items are taxable, tax-exempt, or zero-rated. This document outlines how to implement these rules in Simplr Invoicing.

## Canadian Tax-Exempt Categories

### 1. Zero-Rated Items (0% GST/HST but still counted for registration)
- Basic groceries (milk, bread, vegetables)
- Prescription drugs
- Medical devices
- Exports outside Canada
- International transportation services
- Agricultural products

### 2. Exempt Items (No GST/HST and not counted for registration)
- Health care services
- Educational services (tuition)
- Child care services
- Legal aid services
- Most financial services
- Residential rent (long-term)

### 3. Point-of-Sale Rebates (PST Exempt in Some Provinces)
- Children's clothing (under 15 years)
- Children's footwear (under certain size)
- Children's diapers
- Feminine hygiene products
- Books (in some provinces)

## USA Tax-Exempt Categories

### Common Exemptions (Varies by State)
- Groceries (unprepared food)
- Prescription medications
- Medical equipment
- Clothing (in some states)
- Educational materials
- Non-profit purchases
- Resale certificates

## Database Schema for Tax-Exempt Items

```sql
-- Product/Service categories with tax rules
CREATE TABLE item_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  country VARCHAR(2) NOT NULL CHECK (country IN ('US', 'CA')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax exemption rules by category and jurisdiction
CREATE TABLE tax_exemption_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES item_categories(id),
  country VARCHAR(2) NOT NULL,
  state_province VARCHAR(100),  -- NULL means applies to all states/provinces
  tax_type VARCHAR(20) NOT NULL, -- 'GST', 'HST', 'PST', 'QST', 'STATE_TAX'
  exemption_type VARCHAR(20) NOT NULL CHECK (exemption_type IN ('exempt', 'zero_rated')),
  effective_date DATE NOT NULL,
  end_date DATE,
  notes TEXT
);

-- Add to invoice_items table
ALTER TABLE invoice_items ADD COLUMN 
  category_id UUID REFERENCES item_categories(id);

ALTER TABLE invoice_items ADD COLUMN 
  tax_override VARCHAR(20) CHECK (tax_override IN ('taxable', 'exempt', 'zero_rated'));

-- Common Canadian categories
INSERT INTO item_categories (name, country) VALUES
  ('Basic Groceries', 'CA'),
  ('Prescription Drugs', 'CA'),
  ('Medical Devices', 'CA'),
  ('Educational Services', 'CA'),
  ('Health Care Services', 'CA'),
  ('Children''s Clothing', 'CA'),
  ('Books', 'CA'),
  ('Professional Services', 'CA'),
  ('Exports', 'CA');

-- Common US categories
INSERT INTO item_categories (name, country) VALUES
  ('Groceries', 'US'),
  ('Prescription Medications', 'US'),
  ('Medical Equipment', 'US'),
  ('Clothing', 'US'),
  ('Educational Materials', 'US'),
  ('Professional Services', 'US'),
  ('Software/Digital Goods', 'US');

-- Example Canadian exemption rules
INSERT INTO tax_exemption_rules (category_id, country, state_province, tax_type, exemption_type) VALUES
  ((SELECT id FROM item_categories WHERE name = 'Basic Groceries' AND country = 'CA'), 'CA', NULL, 'GST', 'zero_rated'),
  ((SELECT id FROM item_categories WHERE name = 'Basic Groceries' AND country = 'CA'), 'CA', NULL, 'HST', 'zero_rated'),
  ((SELECT id FROM item_categories WHERE name = 'Prescription Drugs' AND country = 'CA'), 'CA', NULL, 'GST', 'zero_rated'),
  ((SELECT id FROM item_categories WHERE name = 'Health Care Services' AND country = 'CA'), 'CA', NULL, 'GST', 'exempt'),
  ((SELECT id FROM item_categories WHERE name = 'Children''s Clothing' AND country = 'CA'), 'CA', 'BC', 'PST', 'exempt'),
  ((SELECT id FROM item_categories WHERE name = 'Children''s Clothing' AND country = 'CA'), 'CA', 'MB', 'PST', 'exempt');

-- Example US exemption rules (varies significantly by state)
INSERT INTO tax_exemption_rules (category_id, country, state_province, tax_type, exemption_type) VALUES
  ((SELECT id FROM item_categories WHERE name = 'Groceries' AND country = 'US'), 'US', 'CA', 'STATE_TAX', 'exempt'),
  ((SELECT id FROM item_categories WHERE name = 'Groceries' AND country = 'US'), 'US', 'TX', 'STATE_TAX', 'exempt'),
  ((SELECT id FROM item_categories WHERE name = 'Prescription Medications' AND country = 'US'), 'US', NULL, 'STATE_TAX', 'exempt'),
  ((SELECT id FROM item_categories WHERE name = 'Clothing' AND country = 'US'), 'US', 'PA', 'STATE_TAX', 'exempt'),
  ((SELECT id FROM item_categories WHERE name = 'Clothing' AND country = 'US'), 'US', 'NJ', 'STATE_TAX', 'exempt');
```

## Tax Calculation with Exemptions

```typescript
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  categoryId?: string;
  taxOverride?: 'taxable' | 'exempt' | 'zero_rated';
}

export class TaxCalculationService {
  
  async calculateTaxWithExemptions(
    invoice: Invoice,
    items: InvoiceLineItem[],
    user: User
  ): Promise<DetailedTaxCalculation> {
    const taxableItems: InvoiceLineItem[] = [];
    const exemptItems: InvoiceLineItem[] = [];
    const zeroRatedItems: InvoiceLineItem[] = [];
    
    // Categorize items by tax status
    for (const item of items) {
      const taxStatus = await this.getItemTaxStatus(
        item,
        user.country,
        invoice.billingState || user.state
      );
      
      switch (taxStatus) {
        case 'exempt':
          exemptItems.push(item);
          break;
        case 'zero_rated':
          zeroRatedItems.push(item);
          break;
        default:
          taxableItems.push(item);
      }
    }
    
    // Calculate totals
    const taxableSubtotal = this.calculateSubtotal(taxableItems);
    const exemptSubtotal = this.calculateSubtotal(exemptItems);
    const zeroRatedSubtotal = this.calculateSubtotal(zeroRatedItems);
    
    // For Canada - check GST registration status
    if (user.country === 'CA') {
      const gstStatus = await this.checkGSTRegistration(user.id);
      
      // Small supplier - no tax collection
      if (!gstStatus.isRegistered && !gstStatus.mustRegister) {
        return {
          taxableAmount: new Money(0, 'CAD'),
          exemptAmount: exemptSubtotal.add(taxableSubtotal), // Everything is effectively exempt
          zeroRatedAmount: zeroRatedSubtotal,
          taxes: [],
          totalTax: new Money(0, 'CAD'),
          notes: ['GST/HST not applicable - small supplier status']
        };
      }
    }
    
    // Calculate taxes only on taxable items
    const taxes = await this.calculateTaxesForAmount(
      taxableSubtotal,
      user.country,
      invoice.billingState || user.state
    );
    
    return {
      taxableAmount: taxableSubtotal,
      exemptAmount: exemptSubtotal,
      zeroRatedAmount: zeroRatedSubtotal,
      taxes: taxes.calculations,
      totalTax: taxes.totalTax,
      notes: this.generateTaxNotes(exemptItems, zeroRatedItems)
    };
  }
  
  private async getItemTaxStatus(
    item: InvoiceLineItem,
    country: string,
    stateProvince?: string
  ): Promise<'taxable' | 'exempt' | 'zero_rated'> {
    // Manual override takes precedence
    if (item.taxOverride) {
      return item.taxOverride;
    }
    
    // No category = taxable by default
    if (!item.categoryId) {
      return 'taxable';
    }
    
    // Check exemption rules
    const exemptionRules = await supabase
      .from('tax_exemption_rules')
      .select('*')
      .eq('category_id', item.categoryId)
      .eq('country', country)
      .or(`state_province.eq.${stateProvince},state_province.is.null`)
      .single();
    
    if (exemptionRules.data) {
      return exemptionRules.data.exemption_type;
    }
    
    return 'taxable';
  }
  
  private generateTaxNotes(
    exemptItems: InvoiceLineItem[],
    zeroRatedItems: InvoiceLineItem[]
  ): string[] {
    const notes: string[] = [];
    
    if (exemptItems.length > 0) {
      notes.push(`Tax-exempt items: ${exemptItems.map(i => i.description).join(', ')}`);
    }
    
    if (zeroRatedItems.length > 0) {
      notes.push(`Zero-rated items: ${zeroRatedItems.map(i => i.description).join(', ')}`);
    }
    
    return notes;
  }
}
```

## UI Implementation for Tax-Exempt Items

```typescript
// Invoice creation screen component
export const InvoiceItemForm: React.FC = () => {
  const [item, setItem] = useState<InvoiceLineItem>({
    description: '',
    quantity: 1,
    unitPrice: new Money(0, 'USD'),
    categoryId: undefined,
    taxOverride: undefined
  });
  
  const categories = useItemCategories(user.country);
  
  return (
    <div className="invoice-item-form">
      <input
        type="text"
        placeholder="Description"
        value={item.description}
        onChange={(e) => setItem({...item, description: e.target.value})}
      />
      
      {/* Category selection for automatic tax rules */}
      <select
        value={item.categoryId || ''}
        onChange={(e) => setItem({...item, categoryId: e.target.value})}
      >
        <option value="">Select category (optional)</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
            {cat.taxStatus && ` (${cat.taxStatus})`}
          </option>
        ))}
      </select>
      
      {/* Manual tax override */}
      <select
        value={item.taxOverride || ''}
        onChange={(e) => setItem({...item, taxOverride: e.target.value as any})}
      >
        <option value="">Default tax treatment</option>
        <option value="taxable">Force taxable</option>
        <option value="exempt">Force tax-exempt</option>
        <option value="zero_rated">Force zero-rated</option>
      </select>
      
      {/* Show tax status */}
      <TaxStatusIndicator item={item} />
    </div>
  );
};

// Visual indicator for tax status
const TaxStatusIndicator: React.FC<{item: InvoiceLineItem}> = ({item}) => {
  const taxStatus = useTaxStatus(item);
  
  const statusColors = {
    taxable: 'text-gray-600',
    exempt: 'text-green-600',
    zero_rated: 'text-blue-600'
  };
  
  const statusLabels = {
    taxable: 'Taxable',
    exempt: 'Tax Exempt',
    zero_rated: 'Zero-Rated (0%)'
  };
  
  return (
    <span className={`tax-status ${statusColors[taxStatus]}`}>
      {statusLabels[taxStatus]}
    </span>
  );
};
```

## Invoice Display with Mixed Tax Items

### Canadian Invoice Example
```
INVOICE #2024-001

Bill To: ABC Company
Date: January 15, 2024

ITEMS:
Professional Consulting Services      2 hrs @ $150.00    $300.00 T
Office Supplies                      1 lot @ $50.00      $50.00 T
Medical Equipment (Zero-rated)       1 unit @ $500.00   $500.00 Z
Health Care Consultation (Exempt)    1 hr @ $200.00     $200.00 E
----------------------------------------------------------------
Subtotal:                                             $1,050.00

Taxable Subtotal:                                      $350.00
HST (13% on $350.00):                                  $45.50
----------------------------------------------------------------
TOTAL:                                               $1,095.50

GST/HST Registration #: 123456789 RT0001

Legend: T=Taxable, E=Exempt, Z=Zero-rated
Note: Zero-rated and exempt items are not subject to GST/HST
```

### US Invoice Example (California)
```
INVOICE #2024-002

Bill To: XYZ Corporation
Date: January 15, 2024

ITEMS:
Consulting Services                  5 hrs @ $200.00  $1,000.00 T
Prescription Medication (Exempt)     1 lot @ $300.00    $300.00 E
Grocery Items (Exempt in CA)         1 lot @ $150.00    $150.00 E
Office Equipment                     1 unit @ $800.00    $800.00 T
----------------------------------------------------------------
Subtotal:                                             $2,250.00

Taxable Subtotal:                                     $1,800.00
CA State Tax (7.25% on $1,800.00):                     $130.50
LA County Tax (1% on $1,800.00):                        $18.00
----------------------------------------------------------------
TOTAL:                                                $2,398.50

Legend: T=Taxable, E=Exempt
Note: Tax-exempt items marked with 'E' are not subject to sales tax
```

## Complex Scenarios

### 1. Mixed Canadian Small Supplier Invoice
```typescript
// Scenario: Small supplier (not registered) with mixed items
const calculateSmallSupplierInvoice = async (items: InvoiceLineItem[]) => {
  const result = await taxService.calculateTaxWithExemptions(invoice, items, user);
  
  // Even zero-rated items show 0% when not registered
  return {
    ...result,
    displayNote: "GST/HST not applicable - small supplier status",
    showZeroRatedAs: "Not applicable"
  };
};
```

### 2. Partial Exemptions
```typescript
// Some items may be partially exempt (e.g., prepared vs unprepared food)
const partialExemptionRules = {
  'prepared_food': { taxable: true },
  'unprepared_food': { taxable: false },
  'catering_under_$4': { taxable: false }, // Some provinces
  'catering_over_$4': { taxable: true }
};
```

### 3. Customer Tax-Exempt Status
```typescript
// Some customers (non-profits, governments) may be tax-exempt
interface Client {
  id: string;
  name: string;
  taxExempt: boolean;
  taxExemptNumber?: string; // Required if taxExempt is true
  taxExemptCategories?: string[]; // Some exemptions are category-specific
}

// If client is tax-exempt, override all calculations
if (client.taxExempt && client.taxExemptNumber) {
  return {
    taxes: [],
    totalTax: new Money(0, invoice.currency),
    notes: [`Tax exempt - Certificate #${client.taxExemptNumber}`]
  };
}
```

## Testing Tax Exemptions

```typescript
describe('Tax Exemption Calculations', () => {
  it('should handle zero-rated items in Canada', async () => {
    const items = [
      { description: 'Consulting', amount: 1000, categoryId: 'professional_services' },
      { description: 'Basic Groceries', amount: 200, categoryId: 'basic_groceries' }
    ];
    
    const result = await taxService.calculate(items, 'CA', 'ON');
    
    expect(result.taxableAmount).toBe(1000);
    expect(result.zeroRatedAmount).toBe(200);
    expect(result.taxes[0].name).toBe('HST');
    expect(result.taxes[0].amount).toBe(130); // 13% of $1000 only
  });
  
  it('should handle small supplier with zero-rated items', async () => {
    const smallSupplierUser = { 
      gstRegistered: false,
      fourQuarterRevenue: 25000 
    };
    
    const result = await taxService.calculate(items, smallSupplierUser);
    
    expect(result.totalTax).toBe(0);
    expect(result.notes).toContain('small supplier');
  });
});
```

## Important Compliance Notes

1. **Zero-Rated vs Exempt (Canada)**
   - Zero-rated: Counts toward $30,000 threshold
   - Exempt: Does NOT count toward threshold
   - Both result in 0% tax but have different implications

2. **Documentation Requirements**
   - Tax-exempt customers must provide valid exemption certificates
   - Certificates must be kept on file
   - Regular validation of exemption status

3. **Audit Trail**
   - Log all tax exemption applications
   - Track which rule was applied
   - Store exemption certificates

4. **Updates and Maintenance**
   - Tax exemption rules change frequently
   - Need quarterly reviews with CPA
   - System for adding new categories/rules

---

**FOR CPA REVIEW**: 
1. Are the exemption categories complete?
2. Should we allow custom categories?
3. How to handle edge cases (e.g., bundled taxable/exempt items)?
4. Certificate storage requirements?
5. Interstate/interprovincial exemption rules?
