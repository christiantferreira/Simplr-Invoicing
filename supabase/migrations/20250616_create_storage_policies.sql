-- Policies for 'pdfs' bucket
CREATE POLICY "Users can view their own pdfs"
ON storage.objects FOR SELECT
USING ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can upload pdfs to their own folder"
ON storage.objects FOR INSERT
WITH CHECK ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own pdfs"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] );

-- Policies for 'reports' bucket
CREATE POLICY "Users can view their own reports"
ON storage.objects FOR SELECT
USING ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can upload reports to their own folder"
ON storage.objects FOR INSERT
WITH CHECK ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own reports"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] );

-- Policies for 'uploads' bucket
CREATE POLICY "Users can view their own uploads"
ON storage.objects FOR SELECT
USING ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can upload files to their own folder"
ON storage.objects FOR INSERT
WITH CHECK ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] );
