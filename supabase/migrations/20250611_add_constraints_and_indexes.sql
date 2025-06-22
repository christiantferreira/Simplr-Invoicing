-- Add unique constraint to prevent multiple company configs per user
ALTER TABLE company_info 
ADD CONSTRAINT unique_user_company UNIQUE (user_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON company_info(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Add foreign key constraints for data integrity
ALTER TABLE clients 
ADD CONSTRAINT fk_clients_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_client 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE invoice_items 
ADD CONSTRAINT fk_invoice_items_invoice 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
