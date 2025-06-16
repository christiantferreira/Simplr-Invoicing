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
