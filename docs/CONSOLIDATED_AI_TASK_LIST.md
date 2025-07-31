# SIMPLR INVOICING - CONSOLIDATED TASK LIST

*Last Updated: January 2025*  
*Focus: Production-ready web platform with essential business features*

---

## 🎯 **OVERVIEW**

This document contains **actionable development tasks** to complete the Simplr Invoicing web platform. Tasks are organized by technical category and include specific implementation details.

**Current Status:** ~75% complete web platform, ready for final production push

---

## 🗄️ **1. BACKEND TASKS (Supabase)**

### **1.1 Complete RLS Security Implementation** 
**[ID: SECURITY-001]** **[Priority: BLOCKER]** **[Duration: 3-4d]**

⚠️ **MANUAL SUPABASE CHANGES REQUIRED**

**Description:**
Complete Row Level Security implementation and audit all policies to ensure user data isolation.

**Technical Details:**
- Audit RLS policies on tables: `invoices`, `clients`, `invoice_items`, `company_info`, `recurring_invoices`
- Verify data isolation between users in production
- Test with multiple user accounts

**Missing Policies to Create:**
```sql
-- Verify these policies exist and work correctly
CREATE POLICY "Users can only access their own invoices" ON invoices 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own clients" ON clients 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own company info" ON company_info 
FOR ALL USING (auth.uid() = user_id);
```

**Acceptance Criteria:**
- [ ] All tables have working RLS policies
- [ ] Cross-user data leakage test passes (create 2 users, verify isolation)
- [ ] No queries bypass RLS (add explicit user_id filtering where needed)

**Files to Review:**
- `/src/features/invoices/hooks/useSupabaseInvoices.tsx`
- `/src/features/clients/hooks/useClients.ts`

---

### **1.2 Complete Database Infrastructure**
**[ID: DATABASE-001]** **[Priority: HIGH]** **[Duration: 4-5d]**

⚠️ **MANUAL SUPABASE CHANGES REQUIRED**

**Description:**
Complete database schema with all necessary constraints, indexes, and business logic functions.

**Technical Details:**

**Missing Foreign Key Constraints:**
```sql
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE invoice_items ADD CONSTRAINT fk_items_invoice 
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

ALTER TABLE recurring_invoices ADD CONSTRAINT fk_recurring_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
```

**Missing Performance Indexes:**
```sql
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_user_date ON invoices(user_id, created_at);
CREATE INDEX idx_clients_user_name ON clients(user_id, name);
```

**Required Supabase Functions:**
```sql
-- Function for auto-generating invoice numbers with prefixes
CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid uuid, prefix_text text)
RETURNS text AS $$
-- Implementation needed

-- Function for tax calculations (item-level support)
CREATE OR REPLACE FUNCTION calculate_invoice_tax(invoice_uuid uuid)
RETURNS decimal AS $$
-- Implementation needed
```

**Database Issues to Fix:**
- [ ] Regenerate corrupted `/src/integrations/supabase/types.ts`
- [ ] Add unique constraint on `company_info.user_id`
- [ ] Implement storage buckets for invoice attachments

**Acceptance Criteria:**
- [ ] All foreign keys enforced
- [ ] Performance indexes improve query speed >50%
- [ ] Supabase functions work correctly
- [ ] TypeScript types file regenerated and working

---

### **1.3 Fix Invoice System Inconsistencies**
**[ID: INVOICE-001]** **[Priority: BLOCKER]** **[Duration: 2-3d]**

**Description:**
Resolve multiple competing implementations of invoice numbering system and consolidate to single source of truth.

**Current Problem:**
Three different implementations causing inconsistencies:
- `useSupabaseInvoices.tsx`: Simple numbering without prefix support
- `invoiceStore.ts`: Prefix-aware but references wrong table
- `InvoiceContext.tsx`: Uses simple version

**Technical Solution:**

**Step 1: Choose Standard Implementation**
Use `invoiceStore.ts` approach but fix table references:
```typescript
// In invoiceStore.ts - fix table reference
const { data: settings } = await supabase
  .from('company_info') // Change from 'settings' to 'company_info'
  .select('invoice_prefix')
  .eq('user_id', user.id)
  .single();
```

**Step 2: Migration Plan**
- [ ] Update all invoice creation flows to use standardized numbering
- [ ] Test with existing invoices (ensure no numbering conflicts)
- [ ] Update invoice preview to show correct numbers

**Files to Modify:**
- `/src/features/invoices/hooks/useSupabaseInvoices.tsx` (lines 45-67)
- `/src/features/invoices/stores/invoiceStore.ts` (lines 89-112)
- `/src/features/invoices/contexts/InvoiceContext.tsx` (lines 156-178)

**Acceptance Criteria:**
- [ ] Single consistent invoice numbering system
- [ ] Prefix support works correctly
- [ ] Existing invoices maintain their numbers
- [ ] All invoice creation flows use same logic

---

## 🎨 **2. FRONTEND TASKS**

### **2.1 Complete Client Management Features**
**[ID: CLIENT-001]** **[Priority: MEDIUM]** **[Duration: 3-4d]**

**Description:**
Complete missing client management functionality and improve UX.

**Current Status:**
- ✅ Basic CRUD operations working
- ✅ Search/filtering implemented (`ClientsList.tsx:25-29`)
- ✅ CSV export implemented (`generateCsv.ts`)
- ❌ Client history placeholder needs implementation
- ❌ Bulk operations missing

**Missing Features:**

**Client History Implementation:**
```typescript
// In src/features/clients/components/ClientDetails.tsx
// Replace placeholder with actual history
const clientHistory = useMemo(() => {
  return invoices
    .filter(inv => inv.client_id === client.id)
    .map(inv => ({
      date: inv.created_at,
      type: 'invoice',
      amount: inv.total,
      status: inv.status,
      reference: inv.invoice_number
    }));
}, [invoices, client.id]);
```

**Bulk Operations UI:**
- [ ] Checkbox selection for multiple clients
- [ ] Bulk delete with confirmation
- [ ] Bulk export to CSV
- [ ] Bulk email functionality

**Files to Modify:**
- `/src/pages/ClientsList.tsx` (add bulk selection UI)
- `/src/features/clients/components/ClientDetails.tsx` (implement history)
- `/src/features/clients/components/ClientList.tsx` (enhance table)

**Acceptance Criteria:**
- [ ] Client history shows actual invoice/payment data
- [ ] Bulk operations work for 10+ clients
- [ ] CSV import/export handles 100+ records
- [ ] UX is smooth and responsive

---

### **2.2 Enhanced Tax System Implementation**
**[ID: TAX-001]** **[Priority: MEDIUM]** **[Duration: 3-4d]**

⚠️ **MANUAL SUPABASE CHANGES REQUIRED**

**Description:**
Implement item-level tax control system with smart defaults based on user's GST registration status.

**Business Logic:**
- If user has GST number: Default all items to GST/HST rate, allow Tax Exempt selection
- If user has NO GST number: No tax options shown (tax-exempt by default)

**Database Schema Changes:**
```sql
ALTER TABLE invoice_items ADD COLUMN tax_exempt BOOLEAN DEFAULT FALSE;

-- Migration for existing data
UPDATE invoice_items SET tax_exempt = FALSE WHERE tax_exempt IS NULL;
```

**Frontend Implementation:**
```typescript
// In InvoiceEditor.tsx - add tax controls per item
interface InvoiceItem {
  // ... existing fields
  tax_exempt: boolean;
}

// Tax dropdown logic based on user GST status
const getTaxOptions = (userHasGST: boolean, userProvince: string) => {
  if (!userHasGST) return []; // No tax options if no GST number
  
  const taxInfo = getTaxInfoForProvince(userProvince);
  return [
    { value: false, label: `${taxInfo.name} ${taxInfo.rate}%` }, // Default selected
    { value: true, label: 'Tax Exempt' }
  ];
};

// Tax calculation logic
const calculateItemTax = (item: InvoiceItem, userProvince: string) => {
  if (item.tax_exempt) return 0;
  
  const taxInfo = getTaxInfoForProvince(userProvince);
  const itemTotal = item.quantity * item.unit_price;
  return itemTotal * (taxInfo.rate / 100);
};
```

**UI Requirements:**
- [ ] Dropdown per item with province-specific tax rate (GST 5%, HST 13%, etc.) or Tax Exempt
- [ ] Only show tax dropdown if user has GST number in settings
- [ ] Default selection: GST/HST rate (not Tax Exempt)
- [ ] Tax summary shows breakdown by rate in invoice total

**PDF Generation Requirements:**
- [ ] Show tax abbreviation per item: "G" for GST, "H" for HST, blank for Tax Exempt
- [ ] Example: "Web Development (G)" or "Consulting (H)" or "Materials" (no indicator)
- [ ] Invoice total shows: "Subtotal: $X, GST/HST (X%): $Y, Total: $Z"

**Files to Modify:**
- `/src/features/invoices/components/InvoiceForm.tsx` (add tax dropdown logic)
- `/src/features/invoices/components/InvoiceTemplate.tsx` (show tax breakdown)
- `/src/features/invoices/utils/pdfGenerator.ts` (add G/H indicators)

**Acceptance Criteria:**
- [ ] Users with GST number see tax dropdown with correct provincial rate
- [ ] Users without GST number see no tax options (everything tax-exempt)
- [ ] Default selection is GST/HST rate when dropdown is shown
- [ ] PDF shows G/H indicators next to applicable items
- [ ] Tax calculations accurate for mixed taxable/exempt invoices
- [ ] Existing invoices not affected

---

### **2.3 UI/UX Polish & Fixes**
**[ID: FRONTEND-001]** **[Priority: MEDIUM]** **[Duration: 2-3d]**

**Description:**
Fix identified UI issues and improve user experience.

**Issues to Fix:**

**Dark Theme Issues:**
- [ ] Fix theme switching in `/src/contexts/ThemeContext.tsx`
- [ ] Ensure all components respect theme
- [ ] Test dark mode across all pages

**Dashboard Improvements:**
- [ ] Make recent invoices clickable (navigate to invoice details)
- [ ] Add loading states for dashboard stats
- [ ] Improve responsive design on mobile

**Date Picker Enhancement:**
- [ ] Better date selection UX in reports
- [ ] Add preset ranges (This Month, Last Quarter, etc.)
- [ ] Improve mobile date picker experience

**Files to Modify:**
- `/src/contexts/ThemeContext.tsx`
- `/src/pages/Dashboard.tsx` (lines 70-85)
- `/src/features/reports/components/ReportParameterSelection.tsx`

**Acceptance Criteria:**
- [ ] Dark theme works consistently
- [ ] All interactive elements are accessible
- [ ] Mobile experience is smooth
- [ ] No UI glitches or layout issues

---

## 🧪 **3. TESTING & QA**

### **3.1 Complete Test Coverage**
**[ID: TESTING-001]** **[Priority: HIGH]** **[Duration: 5-7d]**

**Description:**
Implement integration testing suite to ensure system components work together correctly and changes in one part don't break related functionality.

**Current Status:**
- ✅ Vitest + React Testing Library configured
- ✅ One test file exists: `Dashboard.test.tsx`
- ❌ No integration tests to verify component interactions

**Primary Focus: Integration Testing**
Goal: Ensure all parts of the system work together and changes don't break related functionality.

**Critical Integration Test Scenarios:**

**1. Invoice System Integration:**
```typescript
// Test: Invoice creation affects all related components
test('invoice creation updates all connected systems', async () => {
  // 1. Create invoice with tax calculations
  // 2. Verify invoice appears in dashboard stats
  // 3. Verify invoice appears in client history
  // 4. Verify invoice appears in reports
  // 5. Verify PDF generation works with correct data
  // 6. Verify email sending uses correct invoice data
});
```

**2. Client System Integration:**
```typescript
// Test: Client changes propagate correctly
test('client updates reflect across system', async () => {
  // 1. Create client
  // 2. Create invoice for client
  // 3. Update client information
  // 4. Verify invoice still shows updated client data
  // 5. Verify PDF regeneration shows new client info
  // 6. Verify reports include updated client data
});
```

**3. Settings Integration:**
```typescript
// Test: Settings changes affect all dependent features
test('settings changes update related functionality', async () => {
  // 1. Change province (affects tax rates)
  // 2. Verify new invoices use correct tax rate
  // 3. Change GST number status
  // 4. Verify tax dropdowns appear/disappear correctly
  // 5. Change invoice prefix
  // 6. Verify new invoices use correct numbering
});
```

**4. Data Consistency Tests:**
```typescript
// Test: Database operations maintain data integrity
test('data operations maintain referential integrity', async () => {
  // 1. Create client with invoices
  // 2. Attempt to delete client (should prevent if has invoices)
  // 3. Create invoice with items
  // 4. Delete invoice (should cascade delete items)
  // 5. Verify no orphaned data remains
});
```

**Files to Create:**
```
src/test/integration/
├── InvoiceSystemIntegration.test.tsx
├── ClientSystemIntegration.test.tsx  
├── SettingsIntegration.test.tsx
├── DataConsistency.test.tsx
└── helpers/
    ├── testDatabase.ts
    └── testHelpers.ts
```

**Test Utilities Needed:**
- Database cleanup helpers (reset between tests)
- Mock Supabase functions for testing
- Test data generators (sample invoices, clients)
- UI interaction helpers (form filling, clicking)

**Acceptance Criteria:**
- [ ] All critical user workflows have integration tests
- [ ] Settings changes tested across all affected components
- [ ] Data consistency verified for all CRUD operations
- [ ] Tests catch breaking changes between related components
- [ ] Tests run automatically on code changes
- [ ] Test database can be reset/seeded for consistent testing

---

### **3.2 Performance & Security Audit**
**[ID: AUDIT-001]** **[Priority: HIGH]** **[Duration: 3-4d]**

**Description:**
Conduct final performance optimization and security review for production.

**Performance Optimization:**

**Current Status:**
- ✅ Lazy loading implemented (`LazyComponents.tsx`)
- ✅ Code splitting configured
- ❌ Bundle analysis needed
- ❌ Performance metrics baseline missing

**Performance Tasks:**
- [ ] Run Lighthouse audit on all major pages
- [ ] Analyze bundle size with `npm run build -- --analyze`
- [ ] Optimize large images/assets
- [ ] Implement service worker for caching (optional PWA)

**Security Review:**
- [ ] Review all Supabase queries for SQL injection risks
- [ ] Verify no sensitive data in localStorage
- [ ] Check for XSS vulnerabilities in user inputs
- [ ] Validate file upload security (if implemented)

**Monitoring Setup:**
```typescript
// Error tracking setup (optional)
// Consider adding Sentry or similar for production error monitoring
```

**Acceptance Criteria:**
- [ ] Lighthouse Performance Score >90
- [ ] Bundle size <2MB gzipped
- [ ] No security vulnerabilities found
- [ ] Error monitoring configured (optional)

---

## 🚀 **4. PRODUCTION DEPLOYMENT**

### **4.1 Production Environment Setup**
**[ID: PRODUCTION-001]** **[Priority: HIGH]** **[Duration: 2-3d]**

**Description:**
Configure production build and deployment pipeline.

**Environment Configuration:**
```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_APP_ENV=production
```

**Build Optimization:**
- [ ] Configure production Vite build
- [ ] Verify all environment variables
- [ ] Test production build locally
- [ ] Set up deployment to hosting platform (Vercel/Netlify)

**Security Headers:**
```typescript
// Configure in hosting platform
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}
      ]
    }
  ]
}
```

**Acceptance Criteria:**
- [ ] Production build works without errors
- [ ] All features work in production environment
- [ ] HTTPS enforced
- [ ] Security headers configured

---

### **4.2 Monitoring & Documentation**
**[ID: DOCUMENTATION-001]** **[Priority: MEDIUM]** **[Duration: 3-4d]**

**Description:**
Complete user documentation and set up basic monitoring.

**User Documentation:**
- [ ] Update README.md with complete setup instructions
- [ ] Create user guide for key features
- [ ] Document common troubleshooting issues
- [ ] Create API documentation for Supabase functions

**Technical Documentation:**
```markdown
# Required documentation files:
- DEPLOYMENT.md (production deployment guide)
- CONTRIBUTING.md (development setup)
- API.md (Supabase functions reference)
- TROUBLESHOOTING.md (common issues)
```

**Basic Monitoring:**
- [ ] Set up Supabase alerts for errors
- [ ] Configure uptime monitoring (optional)
- [ ] Monitor database performance
- [ ] Set up backup strategy

**Acceptance Criteria:**
- [ ] New developer can set up project from README
- [ ] User guide covers all major features
- [ ] Production monitoring alerts work
- [ ] Documentation is up to date

---

## 📊 **TASK SUMMARY**

| **Category** | **Tasks** | **Total Effort** | **Priority** |
|--------------|-----------|------------------|--------------|
| **Backend** | 3 tasks | 9-12 days | BLOCKER/HIGH |
| **Frontend** | 3 tasks | 8-11 days | MEDIUM |
| **Testing & QA** | 2 tasks | 8-11 days | HIGH |
| **Production** | 2 tasks | 5-7 days | HIGH/MEDIUM |

**Total Estimated Effort:** 30-41 days (6-8 weeks with parallelization)

---

## 🔗 **TASK DEPENDENCIES**

**Critical Path:**
1. SECURITY-001 (RLS) → TESTING-001 (can't test without secure data)
2. INVOICE-001 (numbering) → TESTING-001 (needs consistent system to test)
3. TESTING-001 → PRODUCTION-001 (need passing tests for production)

**Parallel Development:**
- CLIENT-001, TAX-001, FRONTEND-001 can be developed in parallel
- AUDIT-001 can start once core functionality is stable
- DOCUMENTATION-001 can be done alongside development

---

*Document End - Ready for Implementation*