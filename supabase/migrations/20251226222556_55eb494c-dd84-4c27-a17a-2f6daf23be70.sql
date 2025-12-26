-- Create storage bucket for book PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-pdfs', 'book-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read PDFs (public bucket)
CREATE POLICY "Anyone can read book PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-pdfs');

-- Allow anyone to upload PDFs (for now, since there's no auth)
CREATE POLICY "Anyone can upload book PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-pdfs');

-- Allow anyone to update their PDFs
CREATE POLICY "Anyone can update book PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'book-pdfs');

-- Allow anyone to delete book PDFs
CREATE POLICY "Anyone can delete book PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-pdfs');