# Simplr Invoicing - Project Requirements Document (PRD)

## 1. Executive Summary

**Project Name:** Simplr Invoicing  
**Version:** 1.0 (MVP)  
**Target Launch:** Q2 2025  
**Platforms:** Android, iOS, Web Application

Simplr Invoicing is a streamlined invoice generation and management platform designed specifically for self-employed professionals and small service-based businesses in Canada. The application focuses on regulatory compliance with CRA requirements while maintaining simplicity and ease of use.

## 2. Problem Statement

Self-employed professionals and small service businesses in Canada struggle with:
- Complex invoicing software that's overengineered for their needs
- Ensuring CRA compliance (GST numbers, proper formatting)
- Managing client information and invoice status tracking
- Creating professional-looking invoices quickly
- Accessing invoicing tools across multiple platforms

## 3. Target Users

**Primary Users:**
- Self-employed professionals (freelancers, consultants, contractors)
- Small service-based businesses (sole proprietors)
- Canadian businesses subject to GST/HST requirements

**User Personas:**
- **Sarah the Freelancer:** Graphic designer, needs quick professional invoices
- **Mike the Contractor:** Handyman, wants simple client management
- **Lisa the Consultant:** Business advisor, requires CRA-compliant documentation

## 4. Core Features & Functionality

### 4.1 ✅ Already Implemented (Web Version)
- **Multiple Invoice Templates:** Classic, Modern, Creative, Professional
- **Company Information Management:** Automatic header population with business details
- **Invoice Customization:** Brand color customization, numbering with prefixes
- **Tax Configuration:** GST/HST support for different provinces/states
- **PDF Generation:** Download invoices as PDF files
- **Email Integration:** Send invoices directly via email
- **Real-time Updates:** Changes reflect immediately across components
- **Smart Fallbacks:** User-friendly placeholder text when data is missing
- **Supabase Integration:** Authentication, database, and storage

### 4.2 🚀 To Be Extended for Mobile
- **Cross-Platform Sync:** Seamless data sync between web and mobile
- **Offline Capability:** Create invoices without internet connection
- **Mobile-Optimized UI:** Touch-friendly interface with native feel
- **Camera Integration:** Scan business cards, add photos to invoices
- **Push Notifications:** Invoice status updates and reminders
- **Native Sharing:** Direct integration with device sharing options

### 4.3 🎯 Enhanced Features for Full Solution
- **Client Management System:** Comprehensive client database with history
- **Advanced Invoice Status Tracking:** Pending, Sent, Viewed, Overdue, Paid
- **Dashboard Analytics:** Visual insights and invoice metrics
- **Recurring Invoices:** Automated invoice generation for repeat clients
- **Expense Tracking:** Basic expense management for CRA reporting
- **Payment Integration:** Optional payment link functionality
- **Reports & Analytics System:** Comprehensive reporting for business insights and tax compliance
  - **Pre-defined Periods:** This Month, Last Month, This Quarter, Last Quarter, This Year, Last Year
  - **Custom Date Range:** User-selectable start and end dates
  - **Report Types:** Revenue Summary, Tax Summary (GST/HST), Client Performance, Invoice Status Overview
  - **Export Options:** PDF, CSV, Excel formats for accounting software integration
  - **Visual Charts:** Revenue trends, payment patterns, client analysis
  - **CRA-Ready Reports:** Tax period summaries with all required information

## 5. Technical Requirements

### 5.1 Backend Architecture (Supabase-First)
- **Database:** PostgreSQL via Supabase (complete data layer)
- **Authentication:** Supabase Auth with Google OAuth
- **File Storage:** Supabase Storage for PDFs, attachments, and exports
- **API Layer:** Supabase auto-generated REST API + GraphQL
- **Real-time:** Supabase Realtime for live updates
- **Edge Functions:** Supabase Edge Functions for server-side logic
- **Row Level Security:** Built-in security and multi-tenancy

### 5.4 Supabase Security Best Practices

**Onboarding Flow RLS Issue:**
- **Problem:** New users were unable to complete the onboarding process due to a "permission denied for table settings" error. This occurred because the Row Level Security (RLS) policies were too restrictive, and the underlying table-level `GRANT` privileges for the `authenticated` role were missing.
- **Solution:** The fix involves two parts:
    1.  **Granting Table Permissions:** The `authenticated` role must be explicitly granted `SELECT, INSERT, UPDATE, DELETE` permissions on the `public.settings` table.
    2.  **Implementing a Robust RLS Policy:** A single, comprehensive `FOR ALL` policy should be used on the `settings` table. This policy uses both `USING` (for read/update/delete operations) and `WITH CHECK` (for write operations) clauses to ensure users can only manage their own records.

- **Implementation Code:**
  ```sql
  -- 1. Grant base permissions to the authenticated role
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.settings TO authenticated;

  -- 2. Drop any conflicting policies
  DROP POLICY IF EXISTS "Users can manage their own settings" ON public.settings;
  -- (Include any other policy names that might exist)

  -- 3. Create the single, correct RLS policy
  CREATE POLICY "Users can manage their own settings"
  ON public.settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  ```
- **Note:** This pattern should be reviewed for all tables that new users need to interact with immediately upon signing up.

### 5.2 Complete Data Architecture in Supabase
- **Users Table:** Business profiles, settings, authentication
- **Clients Table:** Customer information and relationships
- **Invoices Table:** Complete invoice data with status tracking
- **Invoice_Items Table:** Line items and product details
- **Company_Settings Table:** Business configuration and branding
- **Reports_Cache Table:** Pre-computed analytics for performance
- **Audit_Log Table:** Complete activity tracking for compliance
- **File_Attachments Table:** Document management and storage

### 5.3 Frontend Implementation
- **Framework:** React 18 + TypeScript + Vite
- **UI Library:** shadcn-ui (Radix UI + Tailwind CSS)
- **State Management:** TanStack Query + Zustand (with Supabase integration)
- **Real-time Updates:** Supabase Realtime subscriptions
- **Offline Support:** TanStack Query cache with Supabase sync

## 6. User Experience (UX) Requirements

### 6.1 Design Language (Based on Preferred Version)
- **Visual Style:** Clean, modern, professional with purple brand identity
- **UI Framework:** shadcn-ui components with Tailwind CSS (proven choice)
- **Color Scheme:** Purple-based theme (#4A148C primary) with professional accents
- **Typography:** Clean, readable fonts with proper hierarchy
- **Layout:** Card-based design with generous white space
- **Component Style:** Consistent button styles, form inputs, and feedback states

### 6.2 Signup/Onboarding Flow (Reference Design)
- **Welcome Screen:** Clean introduction with brand logo and value proposition
- **Signup Form:** Multi-step business information collection
  - Company name, address, contact information
  - GST/HST number and tax settings
  - Business type and industry selection
  - Professional email verification
- **Progress Indicators:** Clear step-by-step progression
- **Form Validation:** Real-time validation with helpful error messages
- **Success States:** Confirmation screens with next step guidance

### 6.3 Invoice Template Design Philosophy
- **Template Variety:** Multiple professional templates (Classic, Modern, Creative, Professional)
- **CRA Compliance:** All mandatory fields prominently displayed
- **Customization Balance:** Branded but maintaining professional standards
- **Print-Friendly:** Optimized for both digital and print output
- **Mobile Responsive:** Looks good on all device sizes

### 6.4 Cross-Platform Design Consistency
- **Web-First:** Start with web app, then adapt to mobile
- **Component Reusability:** Design system that scales across platforms
- **Touch-Friendly:** Mobile adaptations maintain usability
- **Performance:** Fast loading with smooth interactions

## 7. Reports & Analytics System

### 7.1 Business Intelligence Features
- **Financial Overview Dashboard:** Real-time revenue, outstanding amounts, and payment trends
- **Invoice Analytics:** Status breakdown, average payment times, client performance metrics
- **Tax Reporting:** GST/HST collected, revenue by province, CRA-compliant summaries
- **Client Insights:** Top clients by revenue, payment behavior analysis, relationship tracking

### 7.2 Report Generation System
- **Quick Periods:** One-click reports for common time frames
  - This Month / Last Month
  - This Quarter / Last Quarter  
  - This Year / Last Year
  - Year-to-Date (YTD)
- **Custom Date Range:** Flexible start and end date selection
- **Report Types:**
  - **Revenue Report:** Total invoiced, paid, outstanding by period
  - **Tax Summary:** GST/HST collected, breakdown by province/rate
  - **Client Performance:** Revenue per client, payment patterns
  - **Invoice Status Overview:** Sent, paid, overdue statistics
  - **Aging Report:** Outstanding invoices by age (30, 60, 90+ days)

### 7.3 Export & Integration Options
- **PDF Reports:** Professional formatted reports for presentation
- **CSV Export:** Data export for Excel and accounting software
- **Excel Format:** Direct .xlsx downloads with charts and formatting
- **Email Reports:** Automated report delivery on schedule
- **Print-Ready:** Optimized layouts for physical documentation

### 7.4 CRA Compliance Features
- **Tax Period Reports:** Quarterly and annual GST/HST summaries
- **Business Income Summary:** Revenue breakdown for tax filing
- **Client Transaction History:** Complete audit trail for each client
- **Backup Documentation:** Secure storage of all financial records

### 7.1 CRA Invoice Requirements
- Business name and address
- Client name and address
- Invoice date and number
- Description of goods/services
- GST/HST registration number
- GST/HST amount charged
- Total amount

### 7.2 Data Privacy
- PIPEDA compliance for Canadian users
- Secure data storage and transmission
- User consent for data processing
- Data retention policies

## 8. Success Metrics

### 8.1 User Adoption
- Monthly Active Users (MAU)
- User retention rate (30-day, 90-day)
- App store ratings and reviews
- User onboarding completion rate

### 8.2 Feature Usage
- Invoices created per user per month
- Client database growth
- Invoice sharing method preferences
- Template customization usage

### 8.3 Business Metrics
- Time to create first invoice
- User satisfaction scores
- Support ticket volume
- Feature request frequency

## 9. Development Phases

### Phase 1: Core MVP (Months 1-2)
- User authentication and onboarding
- Basic invoice creation and management
- Client management
- PDF generation and sharing

### Phase 2: Enhanced Features (Months 3-4)
- Advanced invoice customization
- Status tracking and notifications
- Improved dashboard and analytics
- Email integration

### Phase 3: Platform Expansion (Months 5-6)
- iOS and Android app store deployment
- Web application optimization
- Payment link integration (if feasible)
- Advanced reporting features

## 10. Constraints & Assumptions

### 10.1 Constraints
- No direct payment processing capabilities
- Limited to service-based businesses (no inventory management)
- Canadian market focus initially
- Bootstrap budget for development

### 10.2 Assumptions
- Target users have basic smartphone/computer literacy
- Stable internet connection for cloud-based features
- Users understand basic invoicing concepts
- Regulatory requirements remain stable during development

## 11. Risk Assessment

### 11.1 Technical Risks
- **Cross-platform compatibility issues:** Mitigate with thorough testing
- **Third-party service dependencies:** Have backup service providers
- **Data security vulnerabilities:** Implement security best practices

### 11.2 Business Risks
- **Regulatory changes:** Monitor CRA requirement updates
- **Market competition:** Focus on simplicity as differentiator
- **User adoption:** Implement strong onboarding experience

## 12. Next Steps

1. **Technical Architecture Review:** Finalize technology stack decisions
2. **UI/UX Design Phase:** Create wireframes and mockups
3. **Development Environment Setup:** Configure development tools and CI/CD
4. **MVP Development:** Begin with core features implementation
5. **Beta Testing Program:** Recruit early users for feedback
