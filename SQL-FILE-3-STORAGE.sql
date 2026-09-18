-- =====================================================
-- FILE 3: STORAGE BUCKETS
-- Copy semua dari sini sampai bawah!
-- =====================================================

-- Create payment-proofs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Create qris-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('qris-images', 'qris-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for payment-proofs bucket
CREATE POLICY IF NOT EXISTS "Public read access for payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

CREATE POLICY IF NOT EXISTS "Public upload for payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY IF NOT EXISTS "Public delete for payment proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-proofs');

-- Policies for qris-images bucket
CREATE POLICY IF NOT EXISTS "Public read access for QRIS"
ON storage.objects FOR SELECT
USING (bucket_id = 'qris-images');

CREATE POLICY IF NOT EXISTS "Public upload for QRIS"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qris-images');

CREATE POLICY IF NOT EXISTS "Public update for QRIS"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qris-images');

CREATE POLICY IF NOT EXISTS "Public delete for QRIS"
ON storage.objects FOR DELETE
USING (bucket_id = 'qris-images');
