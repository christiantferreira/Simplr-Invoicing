# Simplr Invoicing - Definitive Action Plan (v4.0 - Final)

This document is the master guide for the development of Simplr Invoicing. It consolidates the history of completed tasks, as well as all discussed bugs, improvements, and features. Pending tasks are organized into phases and prioritized.

## Legend
- **[x]** - Task Completed
- **[ ]** - Task Pending
- **[Difficulty: 1-2]** - Effort estimate, where 1 is low and 2 is moderate.
- **[MANUAL ACTION]** - Requires user intervention outside the coding environment (e.g., in the Supabase dashboard).

---

### Phase 0: Implementation History
*(This section remains the same as the previous version, documenting already completed work)*

- [x] **0.1 - System Stabilization and Critical Fixes**
  - **Description:** A series of fixes was implemented to align the frontend with the backend, fix access policies, and refactor the tax logic.
  - **Reference:** `docs/SYSTEM_STABILITY_FIXES.md`
  - **Completed Sub-tasks:**
    - [x] Fixed access failures (404 Errors) by implementing RLS policies in Supabase.
    - [x] Corrected inconsistencies in table and column names between the code and the database.
    - [x] Standardized data types to `snake_case` in the frontend, aligning with the Supabase API.
    - [x] Removed the `tax_configurations` table and automated the tax logic in the frontend.

- [x] **0.2 - Initial UI Implementation (AI Dev Tasks)**
  - **Description:** The user interfaces for the main features were implemented.
  - **Reference:** `docs/task-list-ai-dev.md`
  - **Completed Sub-tasks:**
    - [x] Finalized the Client Management UI (History and Notes).
    - [x] Implemented the UI for Recurring Invoices.
    - [x] Implemented the Reporting System UI (Selection, Charts, and Export).
    - [x] Implemented the UI for Gmail Integration and the Send Invoice Modal.

- [x] **0.3 - Database Infrastructure Finalization**
  - **Description:** The main database features in Supabase were configured and finalized.
  - **Reference:** `docs/FINALIZATION_TASK_LIST.md`
  - **Completed Sub-tasks:**
    - [x] Finalized the Database Schema with relationships and constraints.
    - [x] Implemented Row Level Security (RLS) policies on all tables.
    - [x] Created database Functions and Triggers for business logic.
    - [x] Configured Supabase Storage Buckets.

---

### Phase 1: System Access & Core Logic Restoration (Current Priority)

**Objective:** Fix the critical bugs preventing the application from loading data and functioning correctly.

- [ ] **1.1 - Fix Data Access due to Missing RLS Policies**
  - **Priority:** BLOCKER.
  - **Analysis:** The application is receiving `403 Forbidden` errors because the new database `views` (`invoices_with_dynamic_status`, `clients_with_metrics`) were created without Row Level Security policies.
  - **Reference:** `docs/database_schema_and_rules.md`
  - **Action Plan:**
    - [ ] 1.1.1 **[Difficulty: 1]** **[MANUAL ACTION]** Apply the RLS policy for `invoices_with_dynamic_status`. I will provide the SQL script.
    - [ ] 1.1.2 **[Difficulty: 1]** **[MANUAL ACTION]** Apply the RLS policy for `clients_with_metrics`. I will provide the SQL script.

- [ ] **1.2 - Fix Client Creation Logic**
  - **Priority:** BLOCKER.
  - **Analysis:** Based on the official schema, the `addClient` function is failing because it attempts to insert a `gst_number` into the `clients` table, but that column does not exist.
  - **Action Plan:**
    - [ ] 1.2.1 **[Difficulty: 2]** **Modify `AddClientModal.tsx`**: Remove the "do they have a gst number?" checkbox, the `gstNumber` input field, and all related state and logic from the component.
    - [ ] 1.2.2 **[Difficulty: 1]** **Modify `useSupabaseInvoices.tsx`**: Remove the `gst_number` property from the `insert` statement inside the `addClient` function.
    - [ ] 1.2.3 **[Difficulty: 1]** **Update `types/index.ts`**: Remove the optional `gst_number` property from the `Client` interface to align with the database schema.

- [ ] **1.3 - Fix UI Flickering**
  - **Priority:** HIGH.
  - **Analysis:** The `InvoiceEditor.tsx` component has a `useEffect` hook that calls `setActiveInvoice`, which in turn re-triggers the same `useEffect`, creating an infinite render loop.
  - **Action Plan:**
    - [ ] 1.3.1 **[Difficulty: 2]** **Refactor `InvoiceEditor.tsx`**: Modify the `calculateTotals` `useEffect` to add a condition that prevents `setActiveInvoice` from being called if the calculated totals are the same as the ones already in the state.

---
*The following phases will be executed after the critical blockers in Phase 1 are resolved.*

### Phase 2: Business Logic & Essential UX
- [ ] **2.1 - Refine Invoice Lifecycle and Logic** *(Partially completed, RLS pending)*
- [ ] **2.2 - Fix Dark Theme**
- [ ] **2.3 - Make Recent Invoices Clickable**

### Phase 3: Feature Enhancements
- [ ] **3.1 - Enhance Date Picker**
- [ ] **3.2 - Add "Outstanding Balance" Column**
- [ ] **3.3 - Implement Payment Instructions**

### Phase 4: Simplification & Quality of Life
- [ ] **4.1 - Add Client Filtering and Sorting**
- [ ] **4.2 - Structure Client Address**
- [ ] **4.3 - Simplify Invoice Template**

### Phase 5: Documentation and Support
- [ ] **5.1 - Create Help & Support System**
