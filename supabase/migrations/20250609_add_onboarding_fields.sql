-- Migration: Add onboarding fields to the settings table and create other_service_types_log table

-- Add columns to the settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15),
ADD COLUMN IF NOT EXISTS business_number VARCHAR(15),
ADD COLUMN IF NOT EXISTS has_completed_setup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS service_provider BOOLEAN DEFAULT FALSE;

-- Create other_service_types_log table if it does not exist
CREATE TABLE IF NOT EXISTS other_service_types_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    service_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
