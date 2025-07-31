-- Migration: Add separated address fields to clients table
-- Date: 2025-01-27
-- Description: Adds individual address fields to clients table to match the onboarding address structure

-- Add new address columns
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address_extra_type TEXT,
ADD COLUMN IF NOT EXISTS address_extra_value TEXT,
ADD COLUMN IF NOT EXISTS street_number TEXT,
ADD COLUMN IF NOT EXISTS street_name TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT;

-- Migrate existing address data to street_name temporarily
-- This will help preserve existing data
UPDATE public.clients 
SET street_name = address 
WHERE address IS NOT NULL 
  AND street_name IS NULL;

-- Note: The original 'address' column is kept for backward compatibility
-- It can be removed in a future migration after ensuring all data is migrated

-- Add comment to explain the address fields
COMMENT ON COLUMN public.clients.province IS 'Province/State';
COMMENT ON COLUMN public.clients.city IS 'City';
COMMENT ON COLUMN public.clients.address_extra_type IS 'Type of address extra (Suite, Unit, Apartment, etc.)';
COMMENT ON COLUMN public.clients.address_extra_value IS 'Value of address extra (101, A, etc.)';
COMMENT ON COLUMN public.clients.street_number IS 'Street number';
COMMENT ON COLUMN public.clients.street_name IS 'Street name';
COMMENT ON COLUMN public.clients.county IS 'County (optional)';
COMMENT ON COLUMN public.clients.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN public.clients.gst_number IS 'GST/Tax number';