-- =====================================================
-- SUPABASE STORAGE SETUP
-- Run this in Supabase SQL Editor to create storage buckets
-- =====================================================

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for QRIS images
INSERT INTO storage.buckets (id, name, public)
VALUES ('qris-images', 'qris-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for payment-proofs bucket
-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access for payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow public upload
CREATE POLICY IF NOT EXISTS "Public upload for payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow public delete (for cleanup)
CREATE POLICY IF NOT EXISTS "Public delete for payment proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-proofs');

-- Set up storage policies for qris-images bucket
-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access for QRIS"
ON storage.objects FOR SELECT
USING (bucket_id = 'qris-images');

-- Allow public upload
CREATE POLICY IF NOT EXISTS "Public upload for QRIS"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qris-images');

-- Allow public update/delete
CREATE POLICY IF NOT EXISTS "Public update for QRIS"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qris-images');

CREATE POLICY IF NOT EXISTS "Public delete for QRIS"
ON storage.objects FOR DELETE
USING (bucket_id = 'qris-images');

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT * FROM storage.buckets WHERE id IN ('payment-proofs', 'qris-images');

-- =====================================================
-- SUCCESS!
-- Storage buckets created and ready to use.
-- =====================================================
