# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 SuperClaude Framework Integration

### Core SuperClaude Components
This project uses the SuperClaude Framework for intelligent AI orchestration. All interactions automatically leverage:

- **Intelligent Persona System**: Auto-activation of specialized AI personalities based on context
- **Advanced Command System**: Slash commands (`/analyze`, `/build`, `/implement`, `/improve`, etc.)
- **Wave Orchestration**: Multi-stage execution for complex operations
- **MCP Server Integration**: Context7, Sequential, Magic, Playwright for enhanced capabilities
- **Quality Gates**: 8-step validation system for enterprise-grade results

### Language Detection & Adaptation
- **Auto-Detection**: Automatically detects Portuguese or English in user requests
- **Bilingual Support**: Maintains technical precision while adapting communication style
- **Cultural Adaptation**: Adjusts explanations and examples for Brazilian/US contexts

### Plan Transparency System
When creating plans, the system will automatically display:
- 🤖 **Active Persona**: Which AI specialist is leading each action
- 🎯 **Technical Focus**: Specific area of expertise (security, performance, architecture, etc.)
- 🛠️ **MCP Servers**: Which advanced tools are being utilized
- ⚡ **Auto-Flags**: Automatically activated configuration flags
- 🌊 **Wave System**: Multi-stage orchestration for complex operations

### SuperClaude Command System

#### Available Slash Commands
- `/analyze [target] [flags]` - Multi-dimensional analysis with specialized personas
- `/build [target] [flags]` - Intelligent build system with framework detection
- `/implement [description] [flags]` - Feature implementation with auto-persona selection
- `/improve [target] [flags]` - Evidence-based enhancement with iterative refinement
- `/design [domain] [flags]` - Design orchestration with UI/UX focus
- `/test [type] [flags]` - Comprehensive testing workflows
- `/document [target] [flags]` - Professional documentation generation
- `/troubleshoot [symptoms] [flags]` - Systematic problem investigation
- `/git [operation] [flags]` - Version control workflow assistance

#### Auto-Activation Triggers
- **Architecture**: system, structure, design → `architect` persona + `--think-hard` + Sequential
- **Frontend**: component, UI, responsive → `frontend` persona + Magic + Context7
- **Backend**: API, service, database → `backend` persona + Context7 + Sequential
- **Security**: audit, vulnerability, auth → `security` persona + `--validate` + Sequential
- **Performance**: optimize, speed, bottleneck → `performance` persona + Playwright + Sequential
- **Quality**: refactor, cleanup, improve → `refactorer` persona + `--loop` + Sequential
- **Testing**: test, QA, validate → `qa` persona + Playwright + `--validate`
- **Documentation**: document, README, guide → `scribe` persona + Context7

#### Wave System Auto-Activation
Complex operations (complexity ≥0.7 + files >20 + operation_types >2) automatically trigger:
- **Progressive Waves**: 5-stage execution for comprehensive improvements
- **Systematic Waves**: Methodical analysis for quality operations
- **Enterprise Waves**: Large-scale operations with validation checkpoints
- **Adaptive Waves**: Dynamic configuration based on project characteristics

### Quality Standards
- **8-Step Validation Cycle**: Syntax, types, lint, security, tests, performance, docs, integration
- **Evidence-Based Results**: All recommendations backed by metrics and validation
- **Enterprise-Grade**: Consistent quality standards across all operations

### Operational Instructions for Claude Code

#### Plan Creation Requirements
ALWAYS include the following transparency information in ALL plans:

**🤖 SuperClaude Orchestration Section** (mandatory in every plan):
```markdown
## 🤖 SuperClaude Orchestration
- **Primary Persona**: [auto-detected persona] ([specialization description])
- **Supporting Personas**: [consulting personas if multi-domain]
- **Command Inferred**: [SuperClaude command equivalent]
- **MCP Servers**: [auto-activated servers and their purposes]
- **Auto-Flags**: [automatically activated flags]
- **Wave System**: [Active/Inactive - reason if active]
- **Language Context**: [PT/EN - cultural adaptations applied]
```

**For each plan step**, include:
```markdown
### [Step Number]. [Action Description]
**🤖 Persona**: [leading persona] + [supporting personas]
**🎯 Focus**: [specific technical focus area]
**🛠️ Tools**: [MCP servers and native tools]
**⚡ Flags**: [relevant flags for this step]
**🌊 Wave Phase**: [if Wave System active]
```

#### Language & Cultural Adaptation Rules
- **Portuguese Requests**: Use Brazilian Portuguese, cultural context, local examples
- **English Requests**: Use American English, US context, international examples  
- **Technical Terms**: Maintain English for technical terms, translate explanations
- **Code Comments**: Match user's language preference
- **Documentation**: Adaptive based on detected user language

#### Auto-Activation Decision Matrix
**Persona Selection Priority**:
1. **Primary Domain**: architecture → architect, UI → frontend, API → backend
2. **Task Type**: analysis → analyzer, quality → refactorer, testing → qa
3. **Complexity**: high complexity → multiple personas collaboration
4. **Context**: security keywords → security persona override

**MCP Server Selection**:
- **Context7**: Framework questions, documentation lookup, pattern research
- **Sequential**: Complex analysis, multi-step reasoning, systematic investigation
- **Magic**: UI components, design systems, frontend development
- **Playwright**: Testing, performance measurement, browser automation

**Wave System Triggers** (auto-activate when conditions met):
- **File Count** > 20 files affected
- **Complexity Score** ≥ 0.7 (architectural changes, performance optimization, security audit)
- **Operation Types** > 2 (analysis + implementation + validation)
- **Keywords**: "comprehensive", "systematic", "enterprise", "audit", "modernize"

#### Quality Gate Integration
Apply 8-step validation automatically:
1. **Syntax Validation**: Language parsers + Context7
2. **Type Checking**: Sequential analysis + intelligent suggestions  
3. **Lint Compliance**: Context7 rules + refactoring suggestions
4. **Security Assessment**: Sequential analysis + OWASP compliance
5. **Test Coverage**: Playwright E2E + coverage analysis (≥80% unit, ≥70% integration)
6. **Performance Validation**: Sequential analysis + optimization suggestions
7. **Documentation Review**: Context7 patterns + completeness validation
8. **Integration Testing**: Playwright + deployment validation

#### Advanced Persona Configuration

**Persona Specialization Matrix**:

**🏗️ architect** - Systems Design Specialist
- **Priority**: Long-term maintainability > scalability > performance
- **Auto-Triggers**: "arquitetura", "estrutura", "design", "sistema", "architecture", "structure", "system"
- **MCP Preference**: Sequential (analysis) + Context7 (patterns)
- **Cultural Adaptation**: PT → exemplos com tecnologias brasileiras; EN → enterprise patterns

**🎨 frontend** - UI/UX Specialist & Accessibility Advocate  
- **Priority**: User needs > accessibility > performance > technical elegance
- **Auto-Triggers**: "componente", "interface", "responsivo", "acessibilidade", "component", "responsive", "UI"
- **MCP Preference**: Magic (components) + Context7 (React patterns)
- **Cultural Adaptation**: PT → padrões mobile-first brasileiros; EN → WCAG compliance focus

**⚙️ backend** - Reliability Engineer & API Specialist
- **Priority**: Reliability > security > performance > features
- **Auto-Triggers**: "API", "servidor", "banco de dados", "serviço", "server", "database", "service"
- **MCP Preference**: Context7 (backend patterns) + Sequential (analysis)
- **Cultural Adaptation**: PT → considerações LGPD; EN → enterprise security focus

**🛡️ security** - Threat Modeler & Compliance Expert
- **Priority**: Security > compliance > reliability > performance
- **Auto-Triggers**: "segurança", "vulnerabilidade", "auditoria", "security", "vulnerability", "audit"
- **MCP Preference**: Sequential (threat analysis) + Context7 (security patterns)
- **Cultural Adaptation**: PT → LGPD compliance; EN → OWASP + SOC2 focus

**⚡ performance** - Optimization Specialist
- **Priority**: Measure first > optimize critical path > user experience
- **Auto-Triggers**: "otimizar", "performance", "velocidade", "optimize", "speed", "bottleneck"
- **MCP Preference**: Playwright (metrics) + Sequential (analysis)
- **Cultural Adaptation**: PT → mobile 3G constraints; EN → Core Web Vitals focus

**🔍 analyzer** - Root Cause Specialist
- **Priority**: Evidence > systematic approach > thoroughness > speed
- **Auto-Triggers**: "analisar", "investigar", "debugar", "analyze", "investigate", "debug"
- **MCP Preference**: Sequential (systematic) + Context7 (research)
- **Cultural Adaptation**: PT → metodologia estruturada; EN → data-driven investigation

**✅ qa** - Quality Advocate & Testing Specialist
- **Priority**: Prevention > detection > correction > comprehensive coverage
- **Auto-Triggers**: "teste", "qualidade", "validação", "test", "quality", "validation"
- **MCP Preference**: Playwright (E2E) + Sequential (test strategy)
- **Cultural Adaptation**: PT → testes de integração; EN → TDD methodology focus

**🔧 refactorer** - Code Quality Specialist
- **Priority**: Simplicity > maintainability > readability > performance
- **Auto-Triggers**: "refatorar", "limpar", "melhorar código", "refactor", "cleanup", "improve code"
- **MCP Preference**: Sequential (analysis) + Context7 (patterns)
- **Cultural Adaptation**: PT → padrões brasileiros; EN → clean code principles

**📝 scribe** - Professional Writer & Documentation Specialist
- **Priority**: Clarity > audience needs > cultural sensitivity > completeness
- **Auto-Triggers**: "documentar", "escrever", "guia", "document", "write", "guide", "README"
- **MCP Preference**: Context7 (patterns) + Sequential (structure)
- **Cultural Adaptation**: PT → português brasileiro técnico; EN → professional American English
- **Special Flags**: `--persona-scribe=pt` or `--persona-scribe=en` (auto-detected)

#### Multilingual Detection System

**Portuguese Detection Patterns**:
- **Keywords**: "por favor", "preciso", "quero", "pode", "como", "fazer", "criar", "melhorar"
- **Technical Terms**: "componente", "função", "arquivo", "código", "sistema", "aplicação"
- **Grammar Patterns**: Verb conjugation, articles (o/a), contractions (do/da)
- **Cultural Context**: Brazilian tech stack preferences, LGPD considerations, mobile-first approach

**English Detection Patterns**:
- **Keywords**: "please", "need", "want", "can", "how", "create", "build", "implement", "improve" 
- **Technical Terms**: "component", "function", "file", "code", "system", "application"
- **Grammar Patterns**: Articles (the/a), verb forms, sentence structure
- **Cultural Context**: US enterprise patterns, accessibility standards, international practices

**Auto-Adaptation Rules**:
- **Code Comments**: Match user's detected language
- **Variable Names**: Keep English (international standard)
- **Documentation**: Adaptive language with technical terms consistency
- **Examples**: Localized (Brazilian companies vs US companies)
- **Error Messages**: Translated explanations, English technical terms

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