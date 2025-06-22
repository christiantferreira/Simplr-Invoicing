-- Create settings table for onboarding data
CREATE TABLE IF NOT EXISTS settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    business_legal_name text NOT NULL,
    trade_name text,
    province text NOT NULL,
    city text NOT NULL,
    address_extra_type text,
    address_extra_value text,
    street_number text NOT NULL,
    street_name text NOT NULL,
    county text,
    postal_code text NOT NULL,
    is_service_provider boolean NOT NULL DEFAULT true,
    service_area text,
    service_type text,
    gst_number text,
    business_number text,
    has_completed_setup boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create other_service_types_log table for custom service logging
CREATE TABLE IF NOT EXISTS other_service_types_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    entered_service text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other_service_types_log table
ALTER TABLE other_service_types_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for settings
CREATE POLICY "Users can manage their own settings" ON settings
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policy for other_service_types_log
CREATE POLICY "Users can manage their own service logs" ON other_service_types_log
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger for settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
