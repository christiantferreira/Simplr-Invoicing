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
