-- Create recurring_invoices table for recurring invoice functionality (Task 6.5)
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_generation_date ON recurring_invoices (next_generation_date);
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
    parameter_value text NOT NULL
);

-- Enable RLS on report_parameters table
ALTER TABLE report_parameters ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for report_parameters table
CREATE POLICY "Users can manage their own report parameters" ON report_parameters
    FOR ALL USING (auth.uid() = user_id);

-- Create revenue_report_data table
CREATE TABLE IF NOT EXISTS revenue_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create tax_summary_report_data table
CREATE TABLE IF NOT EXISTS tax_summary_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create client_performance_report_data table
CREATE TABLE IF NOT EXISTS client_performance_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    client_id uuid,
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

-- Create invoice_status_report_data table
CREATE TABLE IF NOT EXISTS invoice_status_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create aging_report_data table
CREATE TABLE IF NOT EXISTS aging_report_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
