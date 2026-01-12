import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Database Types (will be expanded as we create tables)
export interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category: string | null;
  images: string[] | null;
  featured: boolean;
  is_new: boolean;
  is_archived?: boolean;
  discounted_price?: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
  price_modifier: number;
  actual_price?: number;
  discounted_price?: number;
  image_url?: string;
  is_archived?: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_variant_id: string;
  quantity: number;
  created_at: string;
  variant?: ProductVariant & { product?: Product };
}

