-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoice_pdfs', 'Invoice PDFs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf'];

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'Reports', false, 10485760, ARRAY['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user_uploads', 'User Uploads', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Create RLS policies for storage buckets to ensure user-specific access
CREATE POLICY "Users can only access their own files in invoice_pdfs"
ON storage.objects
FOR ALL
USING (bucket_id = 'invoice_pdfs' AND owner = auth.uid());

CREATE POLICY "Users can only access their own files in reports"
ON storage.objects
FOR ALL
USING (bucket_id = 'reports' AND owner = auth.uid());

CREATE POLICY "Users can only access their own files in user_uploads"
ON storage.objects
FOR ALL
USING (bucket_id = 'user_uploads' AND owner = auth.uid());
