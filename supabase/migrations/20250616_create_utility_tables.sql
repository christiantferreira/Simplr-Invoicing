-- Create reports_cache table
CREATE TABLE IF NOT EXISTS reports_cache (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    report_name text NOT NULL,
    parameters jsonb,
    data jsonb,
    generated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- Enable RLS on reports_cache table
ALTER TABLE reports_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for reports_cache table
CREATE POLICY "Users can manage their own reports cache" ON reports_cache
    FOR ALL USING (auth.uid() = user_id);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on activity_log table
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for activity_log table
CREATE POLICY "Users can view their own activity logs" ON activity_log
    FOR SELECT USING (auth.uid() = user_id);
