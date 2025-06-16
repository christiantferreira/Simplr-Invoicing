CREATE OR REPLACE FUNCTION get_revenue_by_period(start_date DATE, end_date DATE, user_id_param UUID)
RETURNS TABLE(total_revenue NUMERIC, total_tax NUMERIC, total_discount NUMERIC, total_invoices BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(total) AS total_revenue,
        SUM(tax) AS total_tax,
        SUM(discount) AS total_discount,
        COUNT(id) AS total_invoices
    FROM
        invoices
    WHERE
        issue_date >= start_date AND issue_date <= end_date AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_client_performance(start_date DATE, end_date DATE, user_id_param UUID)
RETURNS TABLE(client_id UUID, client_name TEXT, total_revenue NUMERIC, total_invoices BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS client_id,
        c.name AS client_name,
        SUM(i.total) AS total_revenue,
        COUNT(i.id) AS total_invoices
    FROM
        invoices i
    JOIN
        clients c ON i.client_id = c.id
    WHERE
        i.issue_date >= start_date AND i.issue_date <= end_date AND i.user_id = user_id_param
    GROUP BY
        c.id, c.name
    ORDER BY
        total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_invoice_status_overview(user_id_param UUID)
RETURNS TABLE(status TEXT, total_invoices BIGINT, total_amount NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.status,
        COUNT(i.id) AS total_invoices,
        SUM(i.total) AS total_amount
    FROM
        invoices i
    WHERE
        i.user_id = user_id_param
    GROUP BY
        i.status;
END;
$$ LANGUAGE plpgsql;
