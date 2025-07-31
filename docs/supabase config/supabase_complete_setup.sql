-- =====================================================
-- SIMPLR INVOICING - COMPLETE SUPABASE DATABASE SETUP
-- =====================================================
-- This script is IDEMPOTENT and SAFE to run multiple times
-- It will create missing structures and fix existing ones without data loss
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS & PREREQUISITES
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. HELPER FUNCTIONS FOR SAFE OPERATIONS
-- =====================================================

-- Function to add constraints only if they don't exist
CREATE OR REPLACE FUNCTION __add_constraint_if_missing(
    p_table TEXT,
    p_constraint TEXT,
    p_sql TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = p_table AND constraint_name = p_constraint
    ) THEN
        EXECUTE p_sql;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create policies only if they don't exist
CREATE OR REPLACE FUNCTION __create_policy_if_missing(
    p_table TEXT,
    p_policy TEXT,
    p_sql TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = p_table AND policyname = p_policy
    ) THEN
        EXECUTE p_sql;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CORE TABLES - CREATE IF NOT EXISTS
-- =====================================================

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    history JSONB,
    notes TEXT,
    -- New address fields
    province TEXT,
    city TEXT,
    address_extra_type TEXT,
    address_extra_value TEXT,
    street_number TEXT,
    street_name TEXT,
    county TEXT,
    postal_code TEXT,
    gst_number TEXT,
    CONSTRAINT clients_pkey PRIMARY KEY (id)
);

-- Add new address columns to existing clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address_extra_type TEXT,
ADD COLUMN IF NOT EXISTS address_extra_value TEXT,
ADD COLUMN IF NOT EXISTS street_number TEXT,
ADD COLUMN IF NOT EXISTS street_name TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT;

-- Migrate existing address data to street_name temporarily
UPDATE public.clients 
SET street_name = address 
WHERE address IS NOT NULL 
  AND street_name IS NULL;

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    business_legal_name TEXT NOT NULL,
    trade_name TEXT,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    address_extra_type TEXT,
    address_extra_value TEXT,
    street_number TEXT NOT NULL,
    street_name TEXT NOT NULL,
    county TEXT,
    postal_code TEXT NOT NULL,
    is_service_provider BOOLEAN NOT NULL DEFAULT true,
    service_area TEXT,
    service_type TEXT,
    gst_number TEXT,
    business_number TEXT,
    has_completed_setup BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_name TEXT,
    email TEXT,
    phone_number TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    invoice_prefix TEXT,
    invoice_start_number INTEGER,
    payment_details JSONB,
    CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    client_id UUID,
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC,
    tax NUMERIC,
    total NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    currency TEXT DEFAULT 'CAD',
    late_fee NUMERIC,
    payment_method TEXT,
    payment_terms TEXT,
    CONSTRAINT invoices_pkey PRIMARY KEY (id)
);

-- Invoice Items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    invoice_id UUID,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    CONSTRAINT invoice_items_pkey PRIMARY KEY (id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT,
    transaction_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT payments_pkey PRIMARY KEY (id)
);

-- Recurring Invoices table
CREATE TABLE IF NOT EXISTS public.recurring_invoices (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    client_id UUID,
    template_invoice_id UUID,
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_generation_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT recurring_invoices_pkey PRIMARY KEY (id)
);

-- Gmail Tokens table
CREATE TABLE IF NOT EXISTS public.gmail_tokens (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT DEFAULT 'https://www.googleapis.com/auth/gmail.send',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT gmail_tokens_pkey PRIMARY KEY (id)
);

-- Activity Log table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT activity_log_pkey PRIMARY KEY (id)
);

-- Other Service Types Log table
CREATE TABLE IF NOT EXISTS public.other_service_types_log (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    entered_service TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT other_service_types_log_pkey PRIMARY KEY (id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    description TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT reports_pkey PRIMARY KEY (id)
);

-- Reports Cache table
CREATE TABLE IF NOT EXISTS public.reports_cache (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    report_name TEXT NOT NULL,
    parameters JSONB,
    data JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT reports_cache_pkey PRIMARY KEY (id)
);

-- Report Parameters table
CREATE TABLE IF NOT EXISTS public.report_parameters (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    report_id UUID,
    parameter_name TEXT NOT NULL,
    parameter_value TEXT NOT NULL,
    CONSTRAINT report_parameters_pkey PRIMARY KEY (id)
);

-- Aging Report Data table
CREATE TABLE IF NOT EXISTS public.aging_report_data (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    report_id UUID,
    age_range TEXT,
    invoice_count INTEGER,
    total_value NUMERIC,
    CONSTRAINT aging_report_data_pkey PRIMARY KEY (id)
);

-- Client Performance Report Data table
CREATE TABLE IF NOT EXISTS public.client_performance_report_data (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    report_id UUID,
    client_id UUID,
    client_name TEXT,
    total_revenue NUMERIC,
    CONSTRAINT client_performance_report_data_pkey PRIMARY KEY (id)
);

-- Invoice Status Report Data table
CREATE TABLE IF NOT EXISTS public.invoice_status_report_data (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    report_id UUID,
    status TEXT,
    invoice_count INTEGER,
    total_value NUMERIC,
    CONSTRAINT invoice_status_report_data_pkey PRIMARY KEY (id)
);

-- Revenue Report Data table
CREATE TABLE IF NOT EXISTS public.revenue_report_data (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    report_id UUID,
    total_invoiced NUMERIC,
    total_paid NUMERIC,
    total_outstanding NUMERIC,
    CONSTRAINT revenue_report_data_pkey PRIMARY KEY (id)
);

-- Tax Summary Report Data table
CREATE TABLE IF NOT EXISTS public.tax_summary_report_data (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    report_id UUID,
    province TEXT,
    gst_hst_collected NUMERIC,
    CONSTRAINT tax_summary_report_data_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 4. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to clients table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'history') THEN
        ALTER TABLE public.clients ADD COLUMN history JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'notes') THEN
        ALTER TABLE public.clients ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add missing columns to invoices table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'currency') THEN
        ALTER TABLE public.invoices ADD COLUMN currency TEXT DEFAULT 'CAD';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'late_fee') THEN
        ALTER TABLE public.invoices ADD COLUMN late_fee NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_method') THEN
        ALTER TABLE public.invoices ADD COLUMN payment_method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_terms') THEN
        ALTER TABLE public.invoices ADD COLUMN payment_terms TEXT;
    END IF;
END $$;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for clients table
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients (user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients (email);

-- Indexes for invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices (invoice_number);

-- Indexes for invoice_items table
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments (payment_date);

-- Indexes for settings table
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings (user_id);

-- Indexes for recurring_invoices table
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON public.recurring_invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_client_id ON public.recurring_invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_generation_date ON public.recurring_invoices (next_generation_date);

-- Indexes for gmail_tokens table
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON public.gmail_tokens (user_id);

-- Indexes for activity_log table
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at);

-- Indexes for reports table
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON public.reports (report_type);

-- =====================================================
-- 6. CREATE VIEWS
-- =====================================================

-- Clients with metrics view
CREATE OR REPLACE VIEW public.clients_with_metrics AS
SELECT 
    c.*,
    COALESCE(SUM(i.total), 0) as total_invoiced,
    COALESCE(SUM(p.amount), 0) as total_paid,
    COALESCE(SUM(i.total), 0) - COALESCE(SUM(p.amount), 0) as outstanding_balance
FROM public.clients c
LEFT JOIN public.invoices i ON c.id = i.client_id
LEFT JOIN public.payments p ON i.id = p.invoice_id
GROUP BY c.id, c.user_id, c.name, c.email, c.phone, c.address, c.company, c.created_at, c.history, c.notes;

-- Invoices with dynamic status view
CREATE OR REPLACE VIEW public.invoices_with_dynamic_status AS
SELECT 
    i.*,
    CASE 
        WHEN i.status = 'paid' THEN 'paid'
        WHEN i.due_date < CURRENT_DATE AND COALESCE(paid_amount.total_paid, 0) < i.total THEN 'overdue'
        WHEN COALESCE(paid_amount.total_paid, 0) >= i.total THEN 'paid'
        WHEN COALESCE(paid_amount.total_paid, 0) > 0 THEN 'partially_paid'
        ELSE i.status
    END as dynamic_status
FROM public.invoices i
LEFT JOIN (
    SELECT 
        invoice_id,
        SUM(amount) as total_paid
    FROM public.payments
    GROUP BY invoice_id
) paid_amount ON i.id = paid_amount.invoice_id;

-- =====================================================
-- 7. CREATE DATABASE FUNCTIONS
-- =====================================================

-- Generate Invoice Number function
CREATE OR REPLACE FUNCTION generate_invoice_number(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Get the next invoice number for this prefix
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.invoices
    WHERE invoice_number LIKE prefix || '%'
    AND invoice_number ~ ('^' || prefix || '[0-9]+$');
    
    -- Format with leading zeros (3 digits)
    formatted_number := prefix || LPAD(next_number::TEXT, 3, '0');
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Email exists function
CREATE OR REPLACE FUNCTION email_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM auth.users WHERE email = email_to_check
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate Aging Report function
CREATE OR REPLACE FUNCTION calculate_aging_report(
    user_id UUID,
    start_date TEXT,
    end_date TEXT
)
RETURNS TABLE(
    age_range TEXT,
    invoice_count INTEGER,
    total_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN CURRENT_DATE - i.due_date <= 30 THEN '0-30 days'
            WHEN CURRENT_DATE - i.due_date <= 60 THEN '31-60 days'
            WHEN CURRENT_DATE - i.due_date <= 90 THEN '61-90 days'
            ELSE '90+ days'
        END as age_range,
        COUNT(*)::INTEGER as invoice_count,
        SUM(i.total - COALESCE(p.total_paid, 0)) as total_value
    FROM public.invoices i
    LEFT JOIN (
        SELECT invoice_id, SUM(amount) as total_paid
        FROM public.payments
        GROUP BY invoice_id
    ) p ON i.id = p.invoice_id
    WHERE i.user_id = calculate_aging_report.user_id
    AND i.status IN ('sent', 'overdue')
    AND i.due_date >= start_date::DATE
    AND i.due_date <= end_date::DATE
    AND (i.total - COALESCE(p.total_paid, 0)) > 0
    GROUP BY age_range
    ORDER BY age_range;
END;
$$ LANGUAGE plpgsql;

-- Calculate Client Performance Report function
CREATE OR REPLACE FUNCTION calculate_client_performance_report(
    user_id UUID,
    start_date TEXT,
    end_date TEXT
)
RETURNS TABLE(
    client_id UUID,
    client_name TEXT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as client_id,
        c.name as client_name,
        COALESCE(SUM(p.amount), 0) as total_revenue
    FROM public.clients c
    LEFT JOIN public.invoices i ON c.id = i.client_id
    LEFT JOIN public.payments p ON i.id = p.invoice_id
    WHERE c.user_id = calculate_client_performance_report.user_id
    AND (p.payment_date IS NULL OR (p.payment_date >= start_date::DATE AND p.payment_date <= end_date::DATE))
    GROUP BY c.id, c.name
    HAVING COALESCE(SUM(p.amount), 0) > 0
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Calculate Invoice Status Overview Report function
CREATE OR REPLACE FUNCTION calculate_invoice_status_overview_report(
    user_id UUID,
    start_date TEXT,
    end_date TEXT
)
RETURNS TABLE(
    status TEXT,
    invoice_count INTEGER,
    total_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.status,
        COUNT(*)::INTEGER as invoice_count,
        SUM(i.total) as total_value
    FROM public.invoices i
    WHERE i.user_id = calculate_invoice_status_overview_report.user_id
    AND i.issue_date >= start_date::DATE
    AND i.issue_date <= end_date::DATE
    GROUP BY i.status
    ORDER BY i.status;
END;
$$ LANGUAGE plpgsql;

-- Calculate Revenue Report function
CREATE OR REPLACE FUNCTION calculate_revenue_report(
    user_id UUID,
    start_date TEXT,
    end_date TEXT
)
RETURNS TABLE(
    total_invoiced NUMERIC,
    total_paid NUMERIC,
    total_outstanding NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(i.total), 0) as total_invoiced,
        COALESCE(SUM(p.amount), 0) as total_paid,
        COALESCE(SUM(i.total), 0) - COALESCE(SUM(p.amount), 0) as total_outstanding
    FROM public.invoices i
    LEFT JOIN public.payments p ON i.id = p.invoice_id
    WHERE i.user_id = calculate_revenue_report.user_id
    AND i.issue_date >= start_date::DATE
    AND i.issue_date <= end_date::DATE;
END;
$$ LANGUAGE plpgsql;

-- Calculate Tax Summary Report function
CREATE OR REPLACE FUNCTION calculate_tax_summary_report(
    user_id UUID,
    start_date TEXT,
    end_date TEXT
)
RETURNS TABLE(
    province TEXT,
    gst_hst_collected NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.province,
        COALESCE(SUM(i.tax), 0) as gst_hst_collected
    FROM public.invoices i
    JOIN public.settings s ON i.user_id = s.user_id
    WHERE i.user_id = calculate_tax_summary_report.user_id
    AND i.issue_date >= start_date::DATE
    AND i.issue_date <= end_date::DATE
    AND i.status IN ('sent', 'paid', 'overdue')
    GROUP BY s.province
    ORDER BY s.province;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign keys only if they don't exist
SELECT __add_constraint_if_missing(
    'invoices',
    'invoices_client_id_fkey',
    'ALTER TABLE public.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL'
);

SELECT __add_constraint_if_missing(
    'invoice_items',
    'invoice_items_invoice_id_fkey',
    'ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE'
);

SELECT __add_constraint_if_missing(
    'payments',
    'payments_invoice_id_fkey',
    'ALTER TABLE public.payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE'
);

SELECT __add_constraint_if_missing(
    'recurring_invoices',
    'recurring_invoices_client_id_fkey',
    'ALTER TABLE public.recurring_invoices ADD CONSTRAINT recurring_invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE'
);

SELECT __add_constraint_if_missing(
    'recurring_invoices',
    'recurring_invoices_template_invoice_id_fkey',
    'ALTER TABLE public.recurring_invoices ADD CONSTRAINT recurring_invoices_template_invoice_id_fkey FOREIGN KEY (template_invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL'
);

-- Report table foreign keys
SELECT __add_constraint_if_missing(
    'report_parameters',
    'report_parameters_report_id_fkey',
    'ALTER TABLE public.report_parameters ADD CONSTRAINT report_parameters_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE'
);

SELECT __add_constraint_if_missing(
    'aging_report_data',
    'aging_report_data_report_id_fkey',
    'ALTER TABLE public.aging_report_data ADD CONSTRAINT aging_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE'
);

SELECT __add_constraint_if_missing(
    'client_performance_report_data',
    'client_performance_report_data_report_id_fkey',
    'ALTER TABLE public.client_performance_report_data ADD CONSTRAINT client_performance_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE'
);

SELECT __add_constraint_if_missing(
    'invoice_status_report_data',
    'invoice_status_report_data_report_id_fkey',
    'ALTER TABLE public.invoice_status_report_data ADD CONSTRAINT invoice_status_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE'
);

SELECT __add_constraint_if_missing(
    'revenue_report_data',
    'revenue_report_data_report_id_fkey',
    'ALTER TABLE public.revenue_report_data ADD CONSTRAINT revenue_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE'
);

SELECT __add_constraint_if_missing(
    'tax_summary_report_data',
    'tax_summary_report_data_report_id_fkey',
    'ALTER TABLE public.tax_summary_report_data ADD CONSTRAINT tax_summary_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE'
);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.other_service_types_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aging_report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_performance_report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_status_report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_summary_report_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
SELECT __create_policy_if_missing(
    'clients',
    'Users can view their own clients',
    'CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'clients',
    'Users can insert their own clients',
    'CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'clients',
    'Users can update their own clients',
    'CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'clients',
    'Users can delete their own clients',
    'CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id)'
);

-- Create RLS policies for invoices table
SELECT __create_policy_if_missing(
    'invoices',
    'Users can view their own invoices',
    'CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'invoices',
    'Users can insert their own invoices',
    'CREATE POLICY "Users can insert their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'invoices',
    'Users can update their own invoices',
    'CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'invoices',
    'Users can delete their own invoices',
    'CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id)'
);

-- Create RLS policies for invoice_items table
SELECT __create_policy_if_missing(
    'invoice_items',
    'Users can view items of their own invoices',
    'CREATE POLICY "Users can view items of their own invoices" ON public.invoice_items FOR SELECT USING (EXISTS(SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()))'
);

SELECT __create_policy_if_missing(
    'invoice_items',
    'Users can insert items to their own invoices',
    'CREATE POLICY "Users can insert items to their own invoices" ON public.invoice_items FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()))'
);

SELECT __create_policy_if_missing(
    'invoice_items',
    'Users can update items of their own invoices',
    'CREATE POLICY "Users can update items of their own invoices" ON public.invoice_items FOR UPDATE USING (EXISTS(SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()))'
);

SELECT __create_policy_if_missing(
    'invoice_items',
    'Users can delete items of their own invoices',
    'CREATE POLICY "Users can delete items of their own invoices" ON public.invoice_items FOR DELETE USING (EXISTS(SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()))'
);

-- Create RLS policies for payments table
SELECT __create_policy_if_missing(
    'payments',
    'Users can view their own payments',
    'CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'payments',
    'Users can insert their own payments',
    'CREATE POLICY "Users can insert their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'payments',
    'Users can update their own payments',
    'CREATE POLICY "Users can update their own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'payments',
    'Users can delete their own payments',
    'CREATE POLICY "Users can delete their own payments" ON public.payments FOR DELETE USING (auth.uid() = user_id)'
);

-- Create RLS policies for settings table
SELECT __create_policy_if_missing(
    'settings',
    'Users can view their own settings',
    'CREATE POLICY "Users can view their own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'settings',
    'Users can insert their own settings',
    'CREATE POLICY "Users can insert their own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'settings',
    'Users can update their own settings',
    'CREATE POLICY "Users can update their own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id)'
);

-- Create RLS policies for recurring_invoices table
SELECT __create_policy_if_missing(
    'recurring_invoices',
    'Users can view their own recurring invoices',
    'CREATE POLICY "Users can view their own recurring invoices" ON public.recurring_invoices FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'recurring_invoices',
    'Users can insert their own recurring invoices',
    'CREATE POLICY "Users can insert their own recurring invoices" ON public.recurring_invoices FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'recurring_invoices',
    'Users can update their own recurring invoices',
    'CREATE POLICY "Users can update their own recurring invoices" ON public.recurring_invoices FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'recurring_invoices',
    'Users can delete their own recurring invoices',
    'CREATE POLICY "Users can delete their own recurring invoices" ON public.recurring_invoices FOR DELETE USING (auth.uid() = user_id)'
);

-- Create RLS policies for gmail_tokens table
SELECT __create_policy_if_missing(
    'gmail_tokens',
    'Users can view their own gmail tokens',
    'CREATE POLICY "Users can view their own gmail tokens" ON public.gmail_tokens FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'gmail_tokens',
    'Users can insert their own gmail tokens',
    'CREATE POLICY "Users can insert their own gmail tokens" ON public.gmail_tokens FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'gmail_tokens',
    'Users can update their own gmail tokens',
    'CREATE POLICY "Users can update their own gmail tokens" ON public.gmail_tokens FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'gmail_tokens',
    'Users can delete their own gmail tokens',
    'CREATE POLICY "Users can delete their own gmail tokens" ON public.gmail_tokens FOR DELETE USING (auth.uid() = user_id)'
);

-- Create RLS policies for activity_log table
SELECT __create_policy_if_missing(
    'activity_log',
    'Users can view their own activity log',
    'CREATE POLICY "Users can view their own activity log" ON public.activity_log FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'activity_log',
    'Users can insert their own activity log',
    'CREATE POLICY "Users can insert their own activity log" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

-- Create RLS policies for other_service_types_log table
SELECT __create_policy_if_missing(
    'other_service_types_log',
    'Users can view their own service types log',
    'CREATE POLICY "Users can view their own service types log" ON public.other_service_types_log FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'other_service_types_log',
    'Users can insert their own service types log',
    'CREATE POLICY "Users can insert their own service types log" ON public.other_service_types_log FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

-- Create RLS policies for reports table
SELECT __create_policy_if_missing(
    'reports',
    'Users can view their own reports',
    'CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'reports',
    'Users can insert their own reports',
    'CREATE POLICY "Users can insert their own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'reports',
    'Users can update their own reports',
    'CREATE POLICY "Users can update their own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'reports',
    'Users can delete their own reports',
    'CREATE POLICY "Users can delete their own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id)'
);

-- Create RLS policies for reports_cache table
SELECT __create_policy_if_missing(
    'reports_cache',
    'Users can view their own reports cache',
    'CREATE POLICY "Users can view their own reports cache" ON public.reports_cache FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'reports_cache',
    'Users can insert their own reports cache',
    'CREATE POLICY "Users can insert their own reports cache" ON public.reports_cache FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'reports_cache',
    'Users can update their own reports cache',
    'CREATE POLICY "Users can update their own reports cache" ON public.reports_cache FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'reports_cache',
    'Users can delete their own reports cache',
    'CREATE POLICY "Users can delete their own reports cache" ON public.reports_cache FOR DELETE USING (auth.uid() = user_id)'
);

-- Create RLS policies for report_parameters table
SELECT __create_policy_if_missing(
    'report_parameters',
    'Users can view their own report parameters',
    'CREATE POLICY "Users can view their own report parameters" ON public.report_parameters FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'report_parameters',
    'Users can insert their own report parameters',
    'CREATE POLICY "Users can insert their own report parameters" ON public.report_parameters FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'report_parameters',
    'Users can update their own report parameters',
    'CREATE POLICY "Users can update their own report parameters" ON public.report_parameters FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'report_parameters',
    'Users can delete their own report parameters',
    'CREATE POLICY "Users can delete their own report parameters" ON public.report_parameters FOR DELETE USING (auth.uid() = user_id)'
);

-- Create RLS policies for all report data tables
SELECT __create_policy_if_missing(
    'aging_report_data',
    'Users can view their own aging report data',
    'CREATE POLICY "Users can view their own aging report data" ON public.aging_report_data FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'aging_report_data',
    'Users can insert their own aging report data',
    'CREATE POLICY "Users can insert their own aging report data" ON public.aging_report_data FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'client_performance_report_data',
    'Users can view their own client performance report data',
    'CREATE POLICY "Users can view their own client performance report data" ON public.client_performance_report_data FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'client_performance_report_data',
    'Users can insert their own client performance report data',
    'CREATE POLICY "Users can insert their own client performance report data" ON public.client_performance_report_data FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'invoice_status_report_data',
    'Users can view their own invoice status report data',
    'CREATE POLICY "Users can view their own invoice status report data" ON public.invoice_status_report_data FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'invoice_status_report_data',
    'Users can insert their own invoice status report data',
    'CREATE POLICY "Users can insert their own invoice status report data" ON public.invoice_status_report_data FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'revenue_report_data',
    'Users can view their own revenue report data',
    'CREATE POLICY "Users can view their own revenue report data" ON public.revenue_report_data FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'revenue_report_data',
    'Users can insert their own revenue report data',
    'CREATE POLICY "Users can insert their own revenue report data" ON public.revenue_report_data FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'tax_summary_report_data',
    'Users can view their own tax summary report data',
    'CREATE POLICY "Users can view their own tax summary report data" ON public.tax_summary_report_data FOR SELECT USING (auth.uid() = user_id)'
);

SELECT __create_policy_if_missing(
    'tax_summary_report_data',
    'Users can insert their own tax summary report data',
    'CREATE POLICY "Users can insert their own tax summary report data" ON public.tax_summary_report_data FOR INSERT WITH CHECK (auth.uid() = user_id)'
);

-- =====================================================
-- 10. UNIQUE CONSTRAINTS
-- =====================================================

-- Add unique constraints only if they don't exist
SELECT __add_constraint_if_missing(
    'settings',
    'settings_user_id_unique',
    'ALTER TABLE public.settings ADD CONSTRAINT settings_user_id_unique UNIQUE (user_id)'
);

SELECT __add_constraint_if_missing(
    'gmail_tokens',
    'gmail_tokens_user_id_unique',
    'ALTER TABLE public.gmail_tokens ADD CONSTRAINT gmail_tokens_user_id_unique UNIQUE (user_id)'
);

-- =====================================================
-- 11. CLEANUP HELPER FUNCTIONS
-- =====================================================

-- Drop helper functions as they're no longer needed
DROP FUNCTION IF EXISTS __add_constraint_if_missing(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS __create_policy_if_missing(TEXT, TEXT, TEXT);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase database setup completed successfully!';
    RAISE NOTICE '📊 All tables, views, functions, and RLS policies are now configured.';
    RAISE NOTICE '🔒 Row Level Security is enabled on all tables.';
    RAISE NOTICE '🚀 Your Simplr Invoicing application is ready to use!';
END $$;