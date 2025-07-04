-- This script recreates the entire database schema from the migration files.
-- Run this script in your Supabase SQL editor.

-- Migration: 20250616_create_core_invoicing_tables.sql
-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    company text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for clients table
CREATE POLICY "Users can manage their own clients" ON clients
    FOR ALL USING (auth.uid() = user_id);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    issue_date date NOT NULL,
    due_date date,
    subtotal numeric(10, 2) NOT NULL,
    discount numeric(10, 2),
    tax numeric(10, 2),
    total numeric(10, 2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invoices_user_id_invoice_number_key UNIQUE (user_id, invoice_number)
);

-- Enable RLS on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for invoices table
CREATE POLICY "Users can manage their own invoices" ON invoices
    FOR ALL USING (auth.uid() = user_id);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10, 2) NOT NULL,
    total numeric(10, 2) NOT NULL
);

-- Enable RLS on invoice_items table
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for invoice_items table
CREATE POLICY "Users can manage their own invoice items" ON invoice_items
    FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

-- Migration: 20250606_create_gmail_tokens_table.sql
-- Create gmail_tokens table for secure token storage
CREATE TABLE IF NOT EXISTS public.gmail_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/gmail.send',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own Gmail tokens" ON public.gmail_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON public.gmail_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_expires_at ON public.gmail_tokens(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_gmail_tokens_updated_at 
    BEFORE UPDATE ON public.gmail_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.gmail_tokens TO authenticated;
GRANT ALL ON public.gmail_tokens TO service_role;


-- Migration: 20250609_complete_onboarding_setup.sql
-- Create settings table for onboarding data
CREATE TABLE IF NOT EXISTS settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    business_legal_name text NOT NULL,
    trade_name text,
    province text NOT NULL,
    city text NOT NULL,
    address_extra_type text,
    address_extra_value text,
    street_number text NOT NULL,
    street_name text NOT NULL,
    county text,
    postal_code text NOT NULL,
    is_service_provider boolean NOT NULL DEFAULT true,
    service_area text,
    service_type text,
    gst_number text,
    business_number text,
    has_completed_setup boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create other_service_types_log table for custom service logging
CREATE TABLE IF NOT EXISTS other_service_types_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    entered_service text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other_service_types_log table
ALTER TABLE other_service_types_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for settings
CREATE POLICY "Users can manage their own settings" ON settings
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policy for other_service_types_log
CREATE POLICY "Users can manage their own service logs" ON other_service_types_log
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger for settings
CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- Migration: 20250616_complete_database_schema.sql
-- Create recurring_invoices table for recurring invoice functionality (Task 6.5)
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    template_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
    frequency text NOT NULL, -- e.g., 'weekly', 'monthly'
    start_date date NOT NULL,
    end_date date,
    next_generation_date date NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on recurring_invoices table
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for recurring_invoices table
CREATE POLICY "Users can manage their own recurring invoices" ON recurring_invoices
    FOR ALL USING (auth.uid() = user_id);

-- Create tax_configurations table if not already fully defined
CREATE TABLE IF NOT EXISTS tax_configurations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    rate numeric(5, 2) NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    province text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on tax_configurations table
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tax_configurations table
CREATE POLICY "Users can manage their own tax configurations" ON tax_configurations
    FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance optimization on frequently queried fields
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices (issue_date);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients (user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON recurring_invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_generation_date ON recurring_invoices (next_generation_date, is_active);
CREATE INDEX IF NOT EXISTS idx_tax_configurations_user_id ON tax_configurations (user_id);

-- Add additional constraints to existing tables if needed
ALTER TABLE invoices
    ADD CONSTRAINT check_positive_subtotal CHECK (subtotal >= 0),
    ADD CONSTRAINT check_positive_total CHECK (total >= 0);

ALTER TABLE invoice_items
    ADD CONSTRAINT check_positive_quantity CHECK (quantity > 0),
    ADD CONSTRAINT check_positive_unit_price CHECK (unit_price >= 0),
    ADD CONSTRAINT check_positive_total CHECK (total >= 0);

-- Add missing fields to invoices if needed for full PRD compliance
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS payment_terms text,
    ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CAD',
    ADD COLUMN IF NOT EXISTS late_fee numeric(10, 2),
    ADD COLUMN IF NOT EXISTS payment_method text;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    report_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    data jsonb -- Store report data as JSON
);

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for reports table
CREATE POLICY "Users can manage their own reports" ON reports
    FOR ALL USING (auth.uid() = user_id);

-- Create report_parameters table
CREATE TABLE IF NOT EXISTS report_parameters (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    parameter_name text NOT NULL,
    parameter_value text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on report_parameters table
ALTER TABLE report_parameters ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for report_parameters table
CREATE POLICY "Users can manage their own report parameters" ON report_parameters
    FOR ALL USING (auth.uid() = user_id);

-- Create revenue_report_data table
CREATE TABLE IF NOT EXISTS revenue_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    total_invoiced numeric,
    total_paid numeric,
    total_outstanding numeric
);

-- Enable RLS on revenue_report_data table
ALTER TABLE revenue_report_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for revenue_report_data table
CREATE POLICY "Users can manage their own revenue_report_data" ON revenue_report_data
    FOR ALL USING (auth.uid() = user_id);

-- Function to calculate revenue report
CREATE OR REPLACE FUNCTION calculate_revenue_report(user_id uuid, start_date date, end_date date)
RETURNS TABLE (total_invoiced numeric, total_paid numeric, total_outstanding numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(CASE WHEN invoices.status != 'Draft' THEN invoices.total ELSE 0 END),
        SUM(CASE WHEN invoices.status = 'Paid' THEN invoices.total ELSE 0 END),
        SUM(CASE WHEN invoices.status != 'Paid' AND invoices.status != 'Draft' THEN invoices.total ELSE 0 END)
    FROM invoices
    WHERE invoices.user_id = calculate_revenue_report.user_id
    AND invoices.issue_date >= calculate_revenue_report.start_date
    AND invoices.issue_date <= calculate_revenue_report.end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for revenue report by period
CREATE OR REPLACE VIEW revenue_report_by_period AS
SELECT
    DATE_TRUNC('month', invoices.issue_date)::date AS period_start,
    SUM(CASE WHEN invoices.status != 'Draft' THEN invoices.total ELSE 0 END) AS total_invoiced,
    SUM(CASE WHEN invoices.status = 'Paid' THEN invoices.total ELSE 0 END) AS total_paid,
    SUM(CASE WHEN invoices.status != 'Paid' AND invoices.status != 'Draft' THEN invoices.total ELSE 0 END) AS total_outstanding
FROM invoices
GROUP BY period_start
ORDER BY period_start;

-- Create tax_summary_report_data table
CREATE TABLE IF NOT EXISTS tax_summary_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    province text,
    gst_hst_collected numeric
);

-- Enable RLS on tax_summary_report_data table
ALTER TABLE tax_summary_report_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tax_summary_report_data table
CREATE POLICY "Users can manage their own tax_summary_report_data" ON tax_summary_report_data
    FOR ALL USING (auth.uid() = user_id);

-- Function to calculate tax summary report
CREATE OR REPLACE FUNCTION calculate_tax_summary_report(user_id uuid, start_date date, end_date date)
RETURNS TABLE (province text, gst_hst_collected numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT
        invoices.province,
        SUM(invoices.gst_hst)
    FROM invoices
    WHERE invoices.user_id = calculate_tax_summary_report.user_id
    AND invoices.issue_date >= calculate_tax_summary_report.start_date
    AND invoices.issue_date <= calculate_tax_summary_report.end_date
    GROUP BY invoices.province;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for tax summary report by period
CREATE OR REPLACE VIEW tax_summary_report_by_period AS
SELECT
    DATE_TRUNC('month', invoices.issue_date)::date AS period_start,
    invoices.province,
    SUM(invoices.gst_hst) AS gst_hst_collected
FROM invoices
GROUP BY period_start, invoices.province
ORDER BY period_start, invoices.province;

-- Create client_performance_report_data table
CREATE TABLE IF NOT EXISTS client_performance_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    client_name text,
    total_revenue numeric
);

-- Enable RLS on client_performance_report_data table
ALTER TABLE client_performance_report_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for client_performance_report_data table
CREATE POLICY "Users can manage their own client_performance_report_data" ON client_performance_report_data
    FOR ALL USING (auth.uid() = user_id);

-- Function to calculate client performance report
CREATE OR REPLACE FUNCTION calculate_client_performance_report(user_id uuid, start_date date, end_date date)
RETURNS TABLE (client_id uuid, client_name text, total_revenue numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT
        clients.id,
        clients.name,
        SUM(invoices.total)
    FROM invoices
    JOIN clients ON invoices.client_id = clients.id
    WHERE invoices.user_id = calculate_client_performance_report.user_id
    AND invoices.issue_date >= calculate_client_performance_report.start_date
    AND invoices.issue_date <= calculate_client_performance_report.end_date
    GROUP BY clients.id, clients.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for client performance report by period
CREATE OR REPLACE VIEW client_performance_report_by_period AS
SELECT
    DATE_TRUNC('month', invoices.issue_date)::date AS period_start,
    clients.id AS client_id,
    clients.name AS client_name,
    SUM(invoices.total) AS total_revenue
FROM invoices
JOIN clients ON invoices.client_id = clients.id
GROUP BY period_start, clients.id, clients.name
ORDER BY period_start, clients.name;

-- Create invoice_status_report_data table
CREATE TABLE IF NOT EXISTS invoice_status_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    status text,
    invoice_count bigint,
    total_value numeric
);

-- Enable RLS on invoice_status_report_data table
ALTER TABLE invoice_status_report_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for invoice_status_report_data table
CREATE POLICY "Users can manage their own invoice_status_report_data" ON invoice_status_report_data
    FOR ALL USING (auth.uid() = user_id);

-- Function to calculate invoice status overview report
CREATE OR REPLACE FUNCTION calculate_invoice_status_overview_report(user_id uuid, start_date date, end_date date)
RETURNS TABLE (status text, invoice_count bigint, total_value numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT
        invoices.status,
        COUNT(*),
        SUM(invoices.total)
    FROM invoices
    WHERE invoices.user_id = calculate_invoice_status_overview_report.user_id
    AND invoices.issue_date >= calculate_invoice_status_overview_report.start_date
    AND invoices.issue_date <= calculate_invoice_status_overview_report.end_date
    GROUP BY invoices.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for invoice status overview report by period
CREATE OR REPLACE VIEW invoice_status_report_by_period AS
SELECT
    DATE_TRUNC('month', invoices.issue_date)::date AS period_start,
    invoices.status,
    COUNT(*) AS invoice_count,
    SUM(invoices.total) AS total_value
FROM invoices
GROUP BY period_start, invoices.status
ORDER BY period_start, invoices.status;

-- Create aging_report_data table
CREATE TABLE IF NOT EXISTS aging_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    age_range text,
    invoice_count bigint,
    total_value numeric
);

-- Enable RLS on aging_report_data table
ALTER TABLE aging_report_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for aging_report_data table
CREATE POLICY "Users can manage their own aging_report_data" ON aging_report_data
    FOR ALL USING (auth.uid() = user_id);

-- Function to calculate aging report
CREATE OR REPLACE FUNCTION calculate_aging_report(user_id uuid, start_date date, end_date date)
RETURNS TABLE (age_range text, invoice_count bigint, total_value numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN (NOW() - invoices.issue_date) <= INTERVAL '30 days' THEN '0-30 days'
            WHEN (NOW() - invoices.issue_date) > INTERVAL '30 days' AND (NOW() - invoices.issue_date) <= INTERVAL '60 days' THEN '31-60 days'
            WHEN (NOW() - invoices.issue_date) > INTERVAL '60 days' AND (NOW() - invoices.issue_date) <= INTERVAL '90 days' THEN '61-90 days'
            ELSE '90+ days'
        END,
        COUNT(*),
        SUM(invoices.total)
    FROM invoices
    WHERE invoices.user_id = calculate_aging_report.user_id
    AND invoices.issue_date >= calculate_aging_report.start_date
    AND invoices.issue_date <= calculate_aging_report.end_date
    AND invoices.status != 'Paid'
    GROUP BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Migration: 20250616_create_audit_log_trigger.sql
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    action_details JSONB;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        action_details := jsonb_build_object('new_data', to_jsonb(NEW));
        INSERT INTO activity_log (user_id, action, details)
        VALUES (NEW.user_id, TG_TABLE_NAME || '_create', action_details);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        action_details := jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW));
        INSERT INTO activity_log (user_id, action, details)
        VALUES (NEW.user_id, TG_TABLE_NAME || '_update', action_details);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        action_details := jsonb_build_object('old_data', to_jsonb(OLD));
        INSERT INTO activity_log (user_id, action, details)
        VALUES (OLD.user_id, TG_TABLE_NAME || '_delete', action_details);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_activity_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER invoices_activity_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER invoice_items_activity_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION log_activity();


-- Migration: 20250616_create_invoice_number_function.sql
CREATE OR REPLACE FUNCTION generate_invoice_number(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    new_invoice_number TEXT;
    next_val BIGINT;
BEGIN
    -- Create sequence if it doesn't exist
    EXECUTE 'CREATE SEQUENCE IF NOT EXISTS invoice_number_seq_' || prefix;

    -- Get the next value from the sequence
    EXECUTE 'SELECT nextval(''invoice_number_seq_' || prefix || ''')' INTO next_val;

    -- Format the new invoice number
    new_invoice_number := prefix || '-' || LPAD(next_val::TEXT, 5, '0');

    RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;


-- Migration: 20250616_create_invoice_total_trigger.sql
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    invoice_subtotal NUMERIC;
    invoice_discount NUMERIC;
    invoice_tax NUMERIC;
    invoice_total NUMERIC;
BEGIN
    -- Get the invoice discount
    SELECT discount INTO invoice_discount FROM invoices WHERE id = NEW.invoice_id;
    IF invoice_discount IS NULL THEN
        invoice_discount := 0;
    END IF;

    -- Calculate the subtotal
    SELECT SUM(total) INTO invoice_subtotal FROM invoice_items WHERE invoice_id = NEW.invoice_id;
    IF invoice_subtotal IS NULL THEN
        invoice_subtotal := 0;
    END IF;

    -- Calculate tax (assuming a simple tax calculation for now)
    -- A more complex tax calculation function can be created later (Task 2.4.3)
    invoice_tax := (invoice_subtotal - invoice_discount) * 0.13; -- Assuming 13% tax for now

    -- Calculate the total
    invoice_total := invoice_subtotal - invoice_discount + invoice_tax;

    -- Update the invoice
    UPDATE invoices
    SET
        subtotal = invoice_subtotal,
        tax = invoice_tax,
        total = invoice_total
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_items_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();


-- Migration: 20250616_create_report_aggregation_functions.sql
CREATE OR REPLACE FUNCTION get_revenue_by_period(start_date DATE, end_date DATE, user_id_param UUID)
RETURNS TABLE(total_revenue NUMERIC, total_tax NUMERIC, total_discount NUMERIC, total_invoices BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(total) AS total_revenue,
        SUM(tax) AS total_tax,
        SUM(discount) AS total_discount,
        COUNT(id) AS total_invoices
    FROM
        invoices
    WHERE
        issue_date >= start_date AND issue_date <= end_date AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_client_performance(start_date DATE, end_date DATE, user_id_param UUID)
RETURNS TABLE(client_id UUID, client_name TEXT, total_revenue NUMERIC, total_invoices BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS client_id,
        c.name AS client_name,
        SUM(i.total) AS total_revenue,
        COUNT(i.id) AS total_invoices
    FROM
        invoices i
    JOIN
        clients c ON i.client_id = c.id
    WHERE
        i.issue_date >= start_date AND i.issue_date <= end_date AND i.user_id = user_id_param
    GROUP BY
        c.id, c.name
    ORDER BY
        total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_invoice_status_overview(user_id_param UUID)
RETURNS TABLE(status TEXT, total_invoices BIGINT, total_amount NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.status,
        COUNT(i.id) AS total_invoices,
        SUM(i.total) AS total_amount
    FROM
        invoices i
    WHERE
        i.user_id = user_id_param
    GROUP BY
        i.status;
END;
$$ LANGUAGE plpgsql;


-- Migration: 20250616_create_storage_policies.sql
-- Policies for 'pdfs' bucket
CREATE POLICY "Users can view their own pdfs"
ON storage.objects FOR SELECT
USING ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can upload pdfs to their own folder"
ON storage.objects FOR INSERT
WITH CHECK ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own pdfs"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] );

-- Policies for 'reports' bucket
CREATE POLICY "Users can view their own reports"
ON storage.objects FOR SELECT
USING ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can upload reports to their own folder"
ON storage.objects FOR INSERT
WITH CHECK ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own reports"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] );

-- Policies for 'uploads' bucket
CREATE POLICY "Users can view their own uploads"
ON storage.objects FOR SELECT
USING ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can upload files to their own folder"
ON storage.objects FOR INSERT
WITH CHECK ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] );


-- Migration: 20250616_create_tax_calculation_function.sql
CREATE OR REPLACE FUNCTION calculate_tax(province_code TEXT, amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    tax_rate NUMERIC;
BEGIN
    -- Get the tax rate for the province
    -- This is a simplified implementation. A more robust solution would use a dedicated tax_rates table.
    CASE province_code
        WHEN 'AB' THEN tax_rate := 0.05;
        WHEN 'BC' THEN tax_rate := 0.12;
        WHEN 'MB' THEN tax_rate := 0.12;
        WHEN 'NB' THEN tax_rate := 0.15;
        WHEN 'NL' THEN tax_rate := 0.15;
        WHEN 'NS' THEN tax_rate := 0.15;
        WHEN 'NT' THEN tax_rate := 0.05;
        WHEN 'NU' THEN tax_rate := 0.05;
        WHEN 'ON' THEN tax_rate := 0.13;
        WHEN 'PE' THEN tax_rate := 0.15;
        WHEN 'QC' THEN tax_rate := 0.14975;
        WHEN 'SK' THEN tax_rate := 0.11;
        WHEN 'YT' THEN tax_rate := 0.05;
        ELSE tax_rate := 0;
    END CASE;

    RETURN amount * tax_rate;
END;
$$ LANGUAGE plpgsql;


-- Migration: 20250616_create_utility_tables.sql

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_date date NOT NULL DEFAULT now(),
  payment_method text,
  transaction_id text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payments table
CREATE POLICY "Users can manage their own payments" ON public.payments
    FOR ALL USING (auth.uid() = user_id);
-- Create reports_cache table
CREATE TABLE IF NOT EXISTS reports_cache (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    report_name text NOT NULL,
    parameters jsonb,
    data jsonb,
    generated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- Enable RLS on reports_cache table
ALTER TABLE reports_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for reports_cache table
CREATE POLICY "Users can manage their own reports cache" ON reports_cache
    FOR ALL USING (auth.uid() = user_id);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on activity_log table
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for activity_log table
CREATE POLICY "Users can view their own activity logs" ON activity_log
    FOR SELECT USING (auth.uid() = user_id);


-- Migration: 20250616_setup_storage_buckets.sql
-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoice_pdfs', 'Invoice PDFs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf'];

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'Reports', false, 10485760, ARRAY['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user_uploads', 'User Uploads', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Create RLS policies for storage buckets to ensure user-specific access
CREATE POLICY "Users can only access their own files in invoice_pdfs"
ON storage.objects
FOR ALL
USING (bucket_id = 'invoice_pdfs' AND owner = auth.uid());

CREATE POLICY "Users can only access their own files in reports"
ON storage.objects
FOR ALL
USING (bucket_id = 'reports' AND owner = auth.uid());

CREATE POLICY "Users can only access their own files in user_uploads"
ON storage.objects
FOR ALL
USING (bucket_id = 'user_uploads' AND owner = auth.uid());
