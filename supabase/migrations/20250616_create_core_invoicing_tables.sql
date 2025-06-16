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

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for clients table
CREATE POLICY "Users can manage their own clients" ON clients
    FOR ALL USING (auth.uid() = user_id);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
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
    updated_at timestamp with time zone DEFAULT now()
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
