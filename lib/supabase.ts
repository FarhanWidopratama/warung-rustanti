import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface MenuItemDB {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  spicy_level: number;
  is_halal: boolean;
  is_vegetarian: boolean;
  is_chef_recommendation: boolean;
  available: boolean;
  created_at: string;
}

export interface OrderDB {
  id: string;
  order_number: string;
  table_number: string;
  customer_name: string;
  items: OrderItemDB[];
  total: number;
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
}

export interface OrderItemDB {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
