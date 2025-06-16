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
