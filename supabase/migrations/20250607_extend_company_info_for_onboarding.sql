-- Extend company_info table for onboarding wizard
-- Truncate existing data as requested for fresh testing
TRUNCATE TABLE company_info CASCADE;

-- Add new columns for onboarding wizard
ALTER TABLE company_info
    ADD COLUMN business_legal_name text NOT NULL DEFAULT '',
    ADD COLUMN trade_name text,
    ADD COLUMN province text NOT NULL DEFAULT '',
    ADD COLUMN city text NOT NULL DEFAULT '',
    ADD COLUMN address_extra_type text,
    ADD COLUMN address_extra_value text,
    ADD COLUMN street_number text NOT NULL DEFAULT '',
    ADD COLUMN street_name text NOT NULL DEFAULT '',
    ADD COLUMN county text,
    ADD COLUMN postal_code text NOT NULL DEFAULT '',
    ADD COLUMN is_service_provider boolean NOT NULL DEFAULT true,
    ADD COLUMN service_area text,
    ADD COLUMN service_type text,
    ADD COLUMN business_number text;

-- Remove default constraints after adding columns
ALTER TABLE company_info
    ALTER COLUMN business_legal_name DROP DEFAULT,
    ALTER COLUMN province DROP DEFAULT,
    ALTER COLUMN city DROP DEFAULT,
    ALTER COLUMN street_number DROP DEFAULT,
    ALTER COLUMN street_name DROP DEFAULT,
    ALTER COLUMN postal_code DROP DEFAULT;

-- Create table for logging custom service types
CREATE TABLE IF NOT EXISTS other_service_types_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    entered_service text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE other_service_types_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for other_service_types_log
CREATE POLICY "Users can manage their own service type logs" ON other_service_types_log
    FOR ALL USING (auth.uid() = user_id);
