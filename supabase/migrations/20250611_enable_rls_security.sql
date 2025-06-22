-- Enable Row Level Security on all critical tables
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;

-- Create security policies for company_info
CREATE POLICY "Users can only access their own company info" 
ON company_info FOR ALL 
USING (auth.uid() = user_id);

-- Create security policies for clients
CREATE POLICY "Users can only access their own clients" 
ON clients FOR ALL 
USING (auth.uid() = user_id);

-- Create security policies for invoices
CREATE POLICY "Users can only access their own invoices" 
ON invoices FOR ALL 
USING (auth.uid() = user_id);

-- Create security policies for invoice_items
CREATE POLICY "Users can only access their own invoice items" 
ON invoice_items FOR ALL 
USING (EXISTS (
  SELECT 1 FROM invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.user_id = auth.uid()
));

-- Create security policies for tax_configurations
CREATE POLICY "Users can only access their own tax configurations" 
ON tax_configurations FOR ALL 
USING (auth.uid() = user_id);
