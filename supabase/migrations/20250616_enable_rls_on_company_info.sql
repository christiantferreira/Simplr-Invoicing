-- Enable RLS on the company_info table
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for company_info table
CREATE POLICY "Users can manage their own company info" ON company_info
    FOR ALL USING (auth.uid() = user_id);
