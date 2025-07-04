-- Seed data for the Simplr Invoicing application

-- It's recommended to run this script after setting up the database schema.
-- This script assumes that you have a user in the auth.users table.
-- Replace 'your_user_id' with an actual user_id from your auth.users table.

-- 1. Seed Clients
INSERT INTO public.clients (user_id, name, email, phone, address, company)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'John Doe', 'john.doe@example.com', '123-456-7890', '123 Main St, Anytown, USA', 'Doe Industries'),
    ('00000000-0000-0000-0000-000000000000', 'Jane Smith', 'jane.smith@example.com', '098-765-4321', '456 Oak Ave, Otherville, USA', 'Smith & Co');

-- 2. Seed Invoices
-- Assuming the clients above were inserted and we can get their IDs.
-- For simplicity, we'll just assume the first client is the one we're using.
INSERT INTO public.invoices (user_id, client_id, invoice_number, status, issue_date, due_date, subtotal, discount, tax, total, notes, payment_terms, currency, late_fee, payment_method)
VALUES
    ('00000000-0000-0000-0000-000000000000', (SELECT id FROM public.clients WHERE email = 'john.doe@example.com'), 'INV-2023-001', 'paid', '2023-10-01', '2023-10-31', 1500.00, 100.00, 182.00, 1582.00, 'Thank you for your business.', 'Net 30', 'USD', 50.00, 'Credit Card'),
    ('00000000-0000-0000-0000-000000000000', (SELECT id FROM public.clients WHERE email = 'jane.smith@example.com'), 'INV-2023-002', 'draft', '2023-10-15', '2023-11-14', 2000.00, 0.00, 260.00, 2260.00, 'Project X deliverables.', 'Net 30', 'USD', 0.00, 'Bank Transfer');

-- 3. Seed Invoice Items
-- Assuming the invoices above were inserted and we can get their IDs.
INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total)
VALUES
    ((SELECT id FROM public.invoices WHERE invoice_number = 'INV-2023-001'), 'Web Development Services', 10, 150.00, 1500.00),
    ((SELECT id FROM public.invoices WHERE invoice_number = 'INV-2023-002'), 'Graphic Design', 20, 100.00, 2000.00);

-- 4. Seed Payments
-- Assuming the first invoice is paid.
INSERT INTO public.payments (invoice_id, user_id, amount, payment_date, payment_method, transaction_id, notes)
VALUES
    ((SELECT id FROM public.invoices WHERE invoice_number = 'INV-2023-001'), '00000000-0000-0000-0000-000000000000', 1582.00, '2023-10-15', 'Credit Card', 'txn_123456789', 'Full payment received.');

-- 5. Seed Settings
INSERT INTO public.settings (user_id, business_legal_name, trade_name, province, city, address_extra_type, address_extra_value, street_number, street_name, county, postal_code, is_service_provider, service_area, service_type, gst_number, business_number, has_completed_setup)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'My Awesome Company Inc.', 'AwesomeCo', 'ON', 'Toronto', 'Suite', '123', '100', 'King St W', 'Toronto County', 'M5X 1A9', true, 'GTA', 'Consulting', '123456789RT0001', '987654321', true);

-- 6. Seed Tax Configurations
INSERT INTO public.tax_configurations (user_id, name, rate, is_default, province)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'HST', 13.00, true, 'ON'),
    ('00000000-0000-0000-0000-000000000000', 'GST', 5.00, false, 'AB');
