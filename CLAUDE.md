# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development Commands
- `npm run dev` - Start development server on localhost:8080
- `npm run build` - Create production build  
- `npm run build:dev` - Create development build
- `npm run lint` - Run ESLint for code quality checks
- `npm run test` - Run Vitest test suite
- `npm run preview` - Preview production build locally

### Database Management
- Database changes are made directly via the Supabase web interface
- No local Supabase setup - using remote instance only
- SQL migrations and schema changes applied through Supabase dashboard

### Additional Available Commands
- No additional npm scripts beyond the primary commands above

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom theme configuration + tailwindcss-animate
- **State Management**: React Context (InvoiceContext) + Zustand for invoices store
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **PDF Generation**: jsPDF with jspdf-autotable for invoice PDFs
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **Testing**: Vitest + Testing Library + jsdom
- **Date Handling**: date-fns for date manipulation
- **CSV Export**: PapaParse for CSV generation
- **Charts/Analytics**: Recharts for dashboard visualizations
- **Notifications**: Sonner for toast notifications
- **Additional UI**: Embla Carousel, Vaul (drawer), input-otp, next-themes
- **Development**: lovable-tagger for component tagging in dev mode

### Project Structure

#### Core Application Layout
- `src/App.tsx` - Root component with providers (QueryClient, Auth, Tooltips)
- `src/main.tsx` - App entry point
- `src/pages/` - Route components (Dashboard, InvoicesList, Settings, etc.)
- `src/components/` - Shared UI components and layout components

#### Feature-Based Organization
- `src/features/clients/` - Client management (components, hooks)
- `src/features/invoices/` - Invoice management (components, contexts, stores, utils)
  - Includes recurring invoices, email sending, multiple PDF templates
- `src/features/dashboard/` - Dashboard analytics and overview with charts
- `src/features/reports/` - Report generation engine with parameter selection and CSV export
- `src/features/settings/` - Business settings and configuration
  - Includes Gmail integration, tax settings, invoice customization

#### Supporting Infrastructure
- `src/integrations/supabase/` - Supabase client configuration and generated types
- `src/hooks/` - Shared React hooks (useAuth, useTaxConfigurations, use-mobile, useSessionStorage)
- `src/types/` - TypeScript type definitions and jsPDF extensions
- `src/components/ui/` - Complete shadcn/ui component library (40+ components)
- `src/components/` - Shared components (Header, Sidebar, Layout, OnboardingWizard, etc.)
- `src/contexts/` - Theme context for dark/light mode
- `src/constants/` - Service types and other constants
- `src/lib/utils.ts` - Utility functions (cn for className merging, etc.)
- `src/pages/` - Route components with lazy loading support

### Key Patterns

#### Data Flow Architecture
- **Primary State**: InvoiceContext (`src/features/invoices/contexts/InvoiceContext.tsx`) manages global application state using useReducer
- **Server State**: useSupabaseInvoices hook handles Supabase integration and syncs with InvoiceContext
- **Company Settings**: Loaded from Supabase `settings` table, managed in InvoiceContext
- **Real-time Updates**: Supabase real-time subscriptions automatically sync data changes

#### Authentication Flow
- useAuth hook (`src/hooks/useAuth.tsx`) provides authentication state
- Supabase handles OAuth providers and email/password authentication
- Protected routes redirect unauthenticated users to Auth page
- User data persists across sessions via Supabase session management

#### PDF Generation System
- Multiple invoice templates: Classic, Modern, Creative (additional templates available)
- Template components in `src/features/invoices/components/` (e.g., `ModernInvoiceTemplate.tsx`, `CreativeInvoiceTemplate.tsx`)
- PDF generation utilities in `src/features/invoices/utils/` with both `pdfGenerator.ts` and `generatePdf.ts`
- Company settings automatically populate invoice headers
- Template switching handled via props to template components
- Unified PDF generation system across all templates

#### Component Patterns
- Extensive use of shadcn/ui components for consistent design system (40+ components)
- Form components use React Hook Form + Zod for validation
- Modal patterns with Radix UI Dialog primitives
- Responsive design with Tailwind CSS breakpoints and mobile-first approach
- Error boundaries for component-level error handling
- Lazy loading components for performance optimization
- Drawer/sheet components for mobile-optimized UX
- Toast notifications with Sonner for user feedback
- Theme switching with next-themes integration

### Database Schema (Supabase)

#### Core Tables
- `settings` - Company/business configuration per user
- `clients` - Client contact information and details
- `invoices` - Invoice headers and metadata
- `invoice_items` - Line items for each invoice
- `tax_configurations` - Province/state-specific tax settings
- `gmail_tokens` - Gmail API integration tokens for email sending
- `payments` - Payment tracking and history (recent addition)
- Additional migration files for client history and payments tracking

#### Key Relationships
- User (Supabase Auth) → Settings (1:1)
- User → Clients (1:many)
- User → Invoices (1:many)
- Client → Invoices (1:many)
- Invoice → InvoiceItems (1:many)

### Environment Configuration

#### Required Environment Variables
```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Local Development
- Vite dev server runs on port 8080 (configured in vite.config.ts with host "::")
- Uses remote Supabase instance - no local database setup required
- Environment variables must be prefixed with `VITE_` for client-side access
- Lovable tagger enabled in development mode for component identification
- Test environment configured with jsdom and global test utilities

### Important Implementation Details

#### Invoice Numbering
- Automatic invoice number generation with customizable prefixes
- Handled in `getNextInvoiceNumber()` function in InvoiceContext
- Prefixes configured in company settings

#### Tax Calculation
- Province/state-specific tax rates stored in tax_configurations table
- Tax calculation logic in `calculateInvoiceTotals()` function
- Support for GST/HST, PST, and combined tax scenarios

#### PDF Templates
- Template switching handled via props to template components
- Consistent company information integration across all templates
- Automatic fallbacks for missing company data

#### Real-time Features
- Supabase real-time subscriptions for live data updates
- Automatic state synchronization when data changes
- Optimistic updates for better user experience

#### Email Integration
- Gmail API integration for sending invoices directly via email
- Email template system with customizable subjects and content
- OAuth token management for secure email sending
- Email sending components integrated with invoice workflows

#### Onboarding System
- Multi-step onboarding wizard for new users
- Business profile setup with Canadian/US tax configuration
- Service area and type selection with province-specific options
- GST/HST number validation for Canadian businesses
- Progress tracking and step validation

#### New Features Added
- **Recurring Invoices**: Automated invoice generation with scheduling
- **Advanced Reports**: Report generation engine with parameter selection
- **Email Integration**: Direct Gmail integration for invoice sending
- **Enhanced Dashboard**: Charts and analytics with Recharts
- **Mobile Optimization**: Drawer components and responsive design
- **Theme System**: Dark/light mode with system preference detection
- **Error Handling**: Comprehensive error boundaries and user feedback

### Testing Strategy
- Unit tests for utility functions and hooks
- Component testing with Testing Library
- Integration tests for critical user flows
- Test configuration in `src/test/setup.ts`

### Code Quality
- ESLint configuration with TypeScript and React rules (eslint.config.js)
- TypeScript strict mode enabled
- Import path aliases configured (`@/` maps to `src/`)
- Vitest configuration with jsdom environment for component testing
- Type-safe Supabase integration with generated types
- Zod schema validation for forms and data structures

### Recent Major Updates
Based on the latest codebase analysis, the following major features have been implemented:

1. **Enhanced Email System**: Gmail API integration with OAuth token management
2. **Comprehensive Onboarding**: Multi-step wizard with business setup and tax configuration
3. **Advanced UI Components**: Full shadcn/ui implementation with 40+ components
4. **Recurring Invoices**: Automated invoice scheduling and generation
5. **Report Generation Engine**: Advanced reporting with parameter selection
6. **Mobile-First Design**: Responsive components with drawer/sheet patterns
7. **Theme System**: Complete dark/light mode implementation
8. **Enhanced PDF Generation**: Unified system across multiple templates
9. **Database Enhancements**: Additional tables for payments and Gmail integration
10. **Testing Infrastructure**: Comprehensive test setup with Vitest and Testing Library

### Known Issues

#### Critical Issues Requiring Immediate Attention
1. **Invoice Numbering System Inconsistencies**
   - Three competing implementations causing data inconsistencies
   - Files affected: `useSupabaseInvoices.tsx`, `invoiceStore.ts`, `InvoiceContext.tsx`
   
2. **Database Security (RLS)**
   - Row Level Security policies incomplete or missing
   - Risk of potential data leakage between users
   
3. **Database Schema Issues**
   - Missing foreign key constraints
   - TypeScript types may be out of sync with database schema
   - Performance indexes needed