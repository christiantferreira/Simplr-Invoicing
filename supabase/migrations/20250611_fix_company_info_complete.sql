-- Migration: Complete company_info table setup and RLS policies
-- This migration fixes all onboarding database issues

-- 1. Ensure table structure is correct
ALTER TABLE public.company_info 
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS address text;

-- 2. Add unique constraint (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'company_info_user_id_key'
    ) THEN
        ALTER TABLE public.company_info 
        ADD CONSTRAINT company_info_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Add indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_info_user_id 
ON public.company_info (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_info_created_at 
ON public.company_info (created_at);

-- 4. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_company_info_updated_at ON public.company_info;
CREATE TRIGGER update_company_info_updated_at
    BEFORE UPDATE ON public.company_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS (idempotent)
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users manage own company info" ON public.company_info;
DROP POLICY IF EXISTS "Service role bypass" ON public.company_info;
DROP POLICY IF EXISTS "Authenticated users can read own data" ON public.company_info;

-- 7. Create comprehensive RLS policies
CREATE POLICY "Users manage own company info"
ON public.company_info
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role bypass (for admin operations)
CREATE POLICY "Service role bypass"
ON public.company_info
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 8. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_info TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure anon role has minimal access
REVOKE ALL ON public.company_info FROM anon;

-- 9. Add version column for optimistic locking (optional but recommended)
ALTER TABLE public.company_info 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Update trigger to increment version
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = COALESCE(OLD.version, 0) + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS increment_company_info_version ON public.company_info;
CREATE TRIGGER increment_company_info_version
    BEFORE UPDATE ON public.company_info
    FOR EACH ROW
    EXECUTE FUNCTION increment_version();
