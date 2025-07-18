# Tax Requirements Documentation: USA & Canada
## For CPA Review - Simplr Invoicing

### Document Purpose
This document outlines the tax calculation logic for the Simplr Invoicing app, targeting small businesses in USA and Canada. All logic will be reviewed by CPAs before implementation.

## Part 1: Canadian Tax System

### Overview
Canada has a multi-tier tax system with federal and provincial components.

### 1.1 Federal Tax - GST (Goods and Services Tax)
- **Rate**: 5% nationwide
- **Applies to**: Most goods and services
- **Registration Threshold**: $30,000 CAD in revenue over 4 consecutive quarters

### 1.2 Provincial Sales Taxes

#### HST (Harmonized Sales Tax) Provinces
Single combined federal + provincial tax:
- **Ontario**: 13% HST (5% federal + 8% provincial)
- **New Brunswick**: 15% HST (5% federal + 10% provincial)
- **Newfoundland and Labrador**: 15% HST
- **Nova Scotia**: 15% HST
- **Prince Edward Island**: 15% HST

#### GST + PST Provinces
Separate federal and provincial taxes:
- **British Columbia**: 5% GST + 7% PST = 12% total
- **Saskatchewan**: 5% GST + 6% PST = 11% total
- **Manitoba**: 5% GST + 7% PST = 12% total

#### GST + QST (Quebec Sales Tax)
- **Quebec**: 5% GST + 9.975% QST = 14.975% total
- Note: QST is calculated on subtotal + GST (tax on tax)

#### GST Only
- **Alberta**: 5% GST only
- **Northwest Territories**: 5% GST only
- **Nunavut**: 5% GST only
- **Yukon**: 5% GST only

### 1.3 Canadian Tax Calculation Logic

```typescript
interface CanadianTaxCalculation {
  province: string;
  subtotal: number;
  
  // Basic calculation
  calculateTax(): {
    gst: number;
    pst_hst: number;
    qst?: number;
    total_tax: number;
    total_amount: number;
  };
}

// Example: Ontario (HST)
const ontarioInvoice = {
  subtotal: 1000.00,
  hst: 130.00,      // 13% of 1000
  total: 1130.00
};

// Example: British Columbia (GST + PST)
const bcInvoice = {
  subtotal: 1000.00,
  gst: 50.00,       // 5% of 1000
  pst: 70.00,       // 7% of 1000
  total_tax: 120.00,
  total: 1120.00
};

// Example: Quebec (GST + QST with compound tax)
const quebecInvoice = {
  subtotal: 1000.00,
  gst: 50.00,       // 5% of 1000
  qst: 104.74,      // 9.975% of (1000 + 50)
  total_tax: 154.74,
  total: 1154.74
};
```

### 1.4 Canadian Tax Exemptions

Common exemptions (vary by province):
- Basic groceries
- Prescription drugs
- Medical devices
- Children's clothing (in some provinces)
- Books (in some provinces)

### 1.5 Registration Number Display
```
GST/HST Registration #: 123456789 RT0001
QST Registration #: 1234567890 TQ0001
```

## Part 2: USA Tax System

### Overview
USA has state-level sales tax with potential local additions. No federal sales tax.

### 2.1 State Sales Tax Rates (2024)

#### States with NO Sales Tax
- Alaska (but localities may charge up to 7.5%)
- Delaware
- Montana
- New Hampshire
- Oregon

#### States with Sales Tax (Base Rates)
| State | Base Rate | Max Combined Rate | Notes |
|-------|-----------|-------------------|-------|
| Alabama | 4% | 14% | High local taxes |
| Arizona | 5.6% | 11.2% | Complex local rates |
| Arkansas | 6.5% | 12% | Local additions |
| California | 7.25% | 10.75% | High base rate |
| Colorado | 2.9% | 11.2% | Many local variations |
| Connecticut | 6.35% | 6.35% | No local tax |
| Florida | 6% | 7.5% | County surtaxes |
| Georgia | 4% | 9% | Local options |
| Hawaii | 4% | 4.5% | Actually GET, not sales tax |
| Idaho | 6% | 9% | Resort/local taxes |
| Illinois | 6.25% | 11% | High in Chicago |
| Indiana | 7% | 7% | No local additions |
| Iowa | 6% | 7% | Local option |
| Kansas | 6.5% | 11.5% | High local rates |
| Kentucky | 6% | 6% | No local tax |
| Louisiana | 4.45% | 11.45% | Parish taxes high |
| Maine | 5.5% | 5.5% | No local tax |
| Maryland | 6% | 6% | No local tax |
| Massachusetts | 6.25% | 6.25% | No local tax |
| Michigan | 6% | 6% | No local tax |
| Minnesota | 6.875% | 8.875% | Some local taxes |
| Mississippi | 7% | 7.25% | Limited local |
| Missouri | 4.225% | 10.85% | Complex local |
| Nebraska | 5.5% | 8% | City taxes |
| Nevada | 6.85% | 8.375% | County variations |
| New Jersey | 6.625% | 6.625% | No local tax |
| New Mexico | 4.875% | 9.0625% | Gross receipts tax |
| New York | 4% | 8.875% | NYC is highest |
| North Carolina | 4.75% | 7.5% | County taxes |
| North Dakota | 5% | 8% | City taxes |
| Ohio | 5.75% | 8% | County/transit taxes |
| Oklahoma | 4.5% | 11.5% | High local rates |
| Pennsylvania | 6% | 8% | Local additions |
| Rhode Island | 7% | 7% | No local tax |
| South Carolina | 6% | 9% | Local options |
| South Dakota | 4.2% | 6.4% | Municipal taxes |
| Tennessee | 7% | 9.75% | High local rates |
| Texas | 6.25% | 8.25% | Local additions |
| Utah | 4.85% | 9.05% | Complex local |
| Vermont | 6% | 7% | Local option |
| Virginia | 5.3% | 7% | Regional taxes |
| Washington | 6.5% | 10.4% | High in Seattle |
| West Virginia | 6% | 7% | Municipal taxes |
| Wisconsin | 5% | 5.6% | County taxes |
| Wyoming | 4% | 6% | County taxes |
| D.C. | 6% | 6% | No local tax |

### 2.2 US Tax Calculation Complexity

#### Origin vs Destination Based
- **Origin-based**: Tax rate where seller is located
- **Destination-based**: Tax rate where buyer is located
- Most states are destination-based for remote sellers

#### Nexus Considerations
- Physical presence nexus
- Economic nexus (typically $100K or 200 transactions)
- Marketplace facilitator laws

### 2.3 US Tax Calculation Logic

```typescript
interface USTaxCalculation {
  sellerState: string;
  sellerZip: string;
  buyerState: string;
  buyerZip: string;
  subtotal: number;
  hasNexus: boolean;
  
  calculateTax(): {
    state_tax: number;
    county_tax: number;
    city_tax: number;
    special_district_tax: number;
    total_tax: number;
    total_amount: number;
  };
}

// Example: California Sale
const californiaSale = {
  subtotal: 1000.00,
  state_tax: 72.50,    // 7.25% state rate
  county_tax: 10.00,   // 1% LA County
  city_tax: 0,         // Varies by city
  district_tax: 15.00, // 1.5% special district
  total_tax: 97.50,    // 9.75% combined
  total: 1097.50
};

// Example: Simple State (Indiana)
const indianaSale = {
  subtotal: 1000.00,
  state_tax: 70.00,    // 7% flat rate
  total_tax: 70.00,
  total: 1070.00
};
```

## Part 3: Implementation Architecture

### 3.1 Tax Service Design

```typescript
interface TaxService {
  calculateCanadianTax(params: {
    province: string;
    subtotal: Decimal;
    taxExempt: boolean;
    itemCategories?: string[];
  }): CanadianTaxResult;
  
  calculateUSTax(params: {
    fromState: string;
    fromZip: string;
    toState: string;
    toZip: string;
    subtotal: Decimal;
    hasNexus: boolean;
  }): USTaxResult;
}

interface TaxResult {
  taxBreakdown: TaxLineItem[];
  totalTax: Decimal;
  totalAmount: Decimal;
  taxJurisdictions: string[];
  warnings?: string[];
}
```

### 3.2 Database Schema for Tax

```sql
-- Tax configuration tables
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY,
  country VARCHAR(2) NOT NULL,
  state_province VARCHAR(100) NOT NULL,
  tax_type VARCHAR(50) NOT NULL, -- 'GST', 'PST', 'HST', 'QST', 'STATE', 'COUNTY', 'CITY'
  rate DECIMAL(6,4) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  compound_on_tax BOOLEAN DEFAULT FALSE, -- For Quebec QST
  notes TEXT
);

-- Store calculated tax for audit trail
CREATE TABLE invoice_taxes (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  tax_type VARCHAR(50) NOT NULL,
  tax_name VARCHAR(100) NOT NULL,
  tax_rate DECIMAL(6,4) NOT NULL,
  taxable_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  jurisdiction VARCHAR(100) NOT NULL
);
```

### 3.3 Tax Display on Invoice

#### Canadian Invoice Display
```
Subtotal:                    $1,000.00
GST (5%):                       $50.00
PST (7%):                       $70.00
----------------------------------------
Total:                       $1,120.00

GST/HST #: 123456789 RT0001
```

#### US Invoice Display
```
Subtotal:                    $1,000.00
CA State Tax (7.25%):           $72.50
LA County Tax (1%):             $10.00
Special District (1.5%):        $15.00
----------------------------------------
Total:                       $1,097.50
```

## Part 4: Compliance Requirements

### 4.1 Required Disclaimers

```typescript
const taxDisclaimer = {
  general: "Tax calculations are estimates based on current rates. Users are responsible for verifying accuracy.",
  canadian: "GST/HST registration may be required based on your revenue.",
  us: "Sales tax requirements vary by state. Consult a tax professional for nexus obligations."
};
```

### 4.2 Audit Trail Requirements

Every tax calculation must store:
- Date/time of calculation
- Tax rates used
- Source of rates (manual entry vs API)
- Jurisdiction details
- Any exemptions applied

### 4.3 Update Frequency

- Tax rates must be updated at least quarterly
- System must handle mid-period rate changes
- Historical rates must be preserved for past invoices

## Part 5: Edge Cases & Validation

### 5.1 Canadian Edge Cases
1. **Quebec tax-on-tax calculation**
2. **First Nations tax exemptions**
3. **Zero-rated vs exempt items**
4. **Inter-provincial sales**
5. **Drop shipping scenarios**

### 5.2 US Edge Cases
1. **Native American reservations**
2. **Military bases**
3. **Interstate commerce**
4. **Digital goods taxation**
5. **SaaS taxability by state**

### 5.3 Validation Rules

```typescript
const validationRules = {
  canada: {
    gstNumber: /^\d{9}\s?RT\d{4}$/,
    qstNumber: /^\d{10}\s?TQ\d{4}$/,
    postalCode: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i
  },
  usa: {
    einNumber: /^\d{2}-\d{7}$/,
    zipCode: /^\d{5}(-\d{4})?$/,
    stateCode: /^[A-Z]{2}$/
  }
};
```

## Part 6: Third-Party Integration Options

### Recommended Tax APIs
1. **TaxJar** - Good for US, limited Canadian support
2. **Avalara** - Comprehensive but expensive
3. **Stripe Tax** - New but promising
4. **Canadian specific**: GST/HST registry API

### Build vs Buy Decision
- **Build**: Canadian tax (simpler, stable rates)
- **Buy**: US tax (complex, frequent changes)

## Part 7: Testing Requirements

### Test Scenarios Matrix

#### Canadian Tests
- [ ] Each province tax calculation
- [ ] Quebec compound tax
- [ ] GST-only provinces
- [ ] Tax-exempt scenarios
- [ ] Registration threshold warnings

#### US Tests
- [ ] Each state base rate
- [ ] High-tax localities (NYC, Chicago)
- [ ] No-tax states
- [ ] Origin vs destination
- [ ] Nexus scenarios

## CPA Review Checklist

Please review and confirm:
1. [ ] Canadian tax rates are current
2. [ ] US state rates are current
3. [ ] Tax calculation logic is correct
4. [ ] Exemption handling is appropriate
5. [ ] Registration requirements are accurate
6. [ ] Disclaimers are sufficient
7. [ ] Audit trail captures enough detail

## Implementation Priority

### Phase 1: Canadian Implementation (Simpler)
1. Implement GST/HST/PST logic
2. Add Quebec QST calculation
3. Test all provinces
4. Add registration warnings

### Phase 2: US Basic Implementation
1. State-level tax only
2. Major cities (top 20)
3. Simple nexus rules
4. No special districts initially

### Phase 3: Enhanced US
1. County-level taxes
2. Special districts
3. Tax API integration
4. Complex nexus rules

---

**Note to CPA**: Please review this logic carefully. All calculations will use decimal arithmetic to avoid floating-point errors. The system will maintain historical tax rates for amended invoices.
