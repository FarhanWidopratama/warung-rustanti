-- =====================================================
-- FILE 1: BASE SCHEMA
-- Copy semua dari sini sampai bawah!
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  image TEXT,
  category VARCHAR(100) NOT NULL,
  spicy_level INTEGER DEFAULT 0,
  is_halal BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT false,
  is_chef_recommendation BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  table_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  total INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample menu items
INSERT INTO menu_items (name, price, image, category, spicy_level, is_halal, is_chef_recommendation) VALUES
  ('Nasi Goreng Kampung', 18000, 'https://images.unsplash.com/photo-1603062096896-0c5c65b37f6e?w=400&h=300&fit=crop', 'Nasi & Noodles', 2, true, true),
  ('Mie Goreng Jawa', 16000, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop', 'Nasi & Noodles', 1, true, false),
  ('Nasi Kuning Komplit', 20000, 'https://images.unsplash.com/photo-1612797395729-e4449b29f339?w=400&h=300&fit=crop', 'Nasi & Noodles', 1, true, false),
  ('Kwetiau Goreng', 19000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', 'Nasi & Noodles', 2, true, false),
  ('Ayam Goreng Kremes', 15000, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', 'Lauk Pauk', 1, true, true),
  ('Rendang Daging', 22000, 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=400&h=300&fit=crop', 'Lauk Pauk', 3, true, false),
  ('Ikan Bakar', 25000, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop', 'Lauk Pauk', 2, true, false),
  ('Tempe Goreng', 5000, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop', 'Lauk Pauk', 0, true, false),
  ('Sayur Asem', 8000, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', 'Sayur', 0, true, false),
  ('Capcay', 12000, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', 'Sayur', 0, true, false),
  ('Tumis Kangkung', 10000, 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=300&fit=crop', 'Sayur', 1, true, false),
  ('Es Teh Manis', 5000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', 'Minuman', 0, true, false),
  ('Es Jeruk', 8000, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop', 'Minuman', 0, true, false),
  ('Es Kelapa Muda', 12000, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop', 'Minuman', 0, true, false),
  ('Kopi Susu', 10000, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop', 'Minuman', 0, true, false)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_items
DROP POLICY IF EXISTS "Allow public read access to menu_items" ON menu_items;
CREATE POLICY "Allow public read access to menu_items"
  ON menu_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to menu_items" ON menu_items;
CREATE POLICY "Allow public insert access to menu_items"
  ON menu_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to menu_items" ON menu_items;
CREATE POLICY "Allow public update access to menu_items"
  ON menu_items FOR UPDATE
  USING (true);

-- RLS Policies for orders
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to orders" ON orders;
CREATE POLICY "Allow public insert access to orders"
  ON orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to orders" ON orders;
CREATE POLICY "Allow public update access to orders"
  ON orders FOR UPDATE
  USING (true);
