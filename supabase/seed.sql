-- Seed data for the clients table
INSERT INTO public.clients (user_id, name, email, phone, address, company)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'John Doe', 'john.doe@example.com', '123-456-7890', '123 Main St, Anytown, USA', 'Doe Inc.'),
    ('00000000-0000-0000-0000-000000000000', 'Jane Smith', 'jane.smith@example.com', '098-765-4321', '456 Oak Ave, Otherville, USA', 'Smith & Co.');

-- Seed data for the invoices table
-- Note: Replace client_id with actual client IDs from the clients table
-- For simplicity, we are not doing that here, but in a real scenario you would.
INSERT INTO public.invoices (user_id, client_id, invoice_number, status, issue_date, due_date, subtotal, discount, tax, total, notes)
VALUES
    ('00000000-0000-0000-0000-000000000000', (SELECT id FROM clients WHERE email = 'john.doe@example.com'), 'INV-001', 'paid', '2025-06-01', '2025-06-15', 1000.00, 0, 100.00, 1100.00, 'Sample invoice 1'),
    ('00000000-0000-0000-0000-000000000000', (SELECT id FROM clients WHERE email = 'jane.smith@example.com'), 'INV-002', 'sent', '2025-06-10', '2025-06-24', 2500.00, 100.00, 240.00, 2640.00, 'Sample invoice 2');

-- Seed data for the invoice_items table
-- Note: Replace invoice_id with actual invoice IDs from the invoices table
INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total)
VALUES
    ((SELECT id FROM invoices WHERE invoice_number = 'INV-001'), 'Web Development Services', 1, 1000.00, 1000.00),
    ((SELECT id FROM invoices WHERE invoice_number = 'INV-002'), 'Graphic Design Services', 1, 2500.00, 2500.00);
