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
