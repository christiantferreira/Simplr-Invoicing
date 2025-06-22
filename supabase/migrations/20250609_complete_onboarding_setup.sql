-- Migration: Complete onboarding setup - Create settings table and other_service_types_log table

-- Create settings table with all onboarding fields
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_legal_name TEXT,
    trade_name TEXT,
    province TEXT,
    city TEXT,
    address_extra_type TEXT,
    address_extra_value TEXT,
    street_number TEXT,
    street_name TEXT,
    county TEXT,
    postal_code TEXT,
    is_service_provider BOOLEAN DEFAULT FALSE,
    service_area TEXT,
    service_type TEXT,
    gst_number TEXT,
    business_number TEXT,
    has_completed_setup BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create other_service_types_log table
CREATE TABLE IF NOT EXISTS other_service_types_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
