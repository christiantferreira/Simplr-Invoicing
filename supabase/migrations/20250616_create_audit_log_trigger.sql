CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    action_details JSONB;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        action_details := jsonb_build_object('new_data', to_jsonb(NEW));
        INSERT INTO activity_log (user_id, action, details)
        VALUES (NEW.user_id, TG_TABLE_NAME || '_create', action_details);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        action_details := jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW));
        INSERT INTO activity_log (user_id, action, details)
        VALUES (NEW.user_id, TG_TABLE_NAME || '_update', action_details);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        action_details := jsonb_build_object('old_data', to_jsonb(OLD));
        INSERT INTO activity_log (user_id, action, details)
        VALUES (OLD.user_id, TG_TABLE_NAME || '_delete', action_details);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_activity_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER invoices_activity_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER invoice_items_activity_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION log_activity();
