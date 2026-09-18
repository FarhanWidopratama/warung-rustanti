-- =====================================================
-- FILE 2: MIGRATION (Payment & Tracking)
-- Copy semua dari sini sampai bawah!
-- =====================================================

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'qris')),
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway')),
ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(50) UNIQUE;

-- Update status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'waiting_payment', 'payment_review', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'));

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for settings
DROP POLICY IF EXISTS "Allow public read access to settings" ON settings;
CREATE POLICY "Allow public read access to settings"
  ON settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to settings" ON settings;
CREATE POLICY "Allow public insert access to settings"
  ON settings FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to settings" ON settings;
CREATE POLICY "Allow public update access to settings"
  ON settings FOR UPDATE
  USING (true);

-- Add trigger for settings
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_phone_number ON orders(phone_number);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Function to generate tracking code
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing orders with tracking codes
UPDATE orders 
SET tracking_code = generate_tracking_code()
WHERE tracking_code IS NULL;

-- Insert default settings
INSERT INTO settings (key, value) 
VALUES ('qris_image_url', NULL)
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) 
VALUES ('tts_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
