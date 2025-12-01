import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CustomProduct {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  discounted_price: number | null;
  category: string;
  images: string[] | null;
  sku: string | null;
  material: string | null;
  care_instructions: string | null;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomProductVariant {
  id: string;
  custom_product_id: string;
  size: string;
  color: string;
  stock: number;
  actual_price: number | null;
  discounted_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface CustomProductWithVariants extends CustomProduct {
  variants: CustomProductVariant[];
}

/**
 * Hook to fetch all active custom products
 */
export const useCustomProducts = () => {
  return useQuery({
    queryKey: ['custom-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomProduct[];
    },
  });
};

/**
 * Hook to fetch a single custom product with variants
 */
export const useCustomProduct = (id: string) => {
  return useQuery({
    queryKey: ['custom-product', id],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from('custom_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { data: variants, error: variantsError } = await supabase
        .from('custom_product_variants')
        .select('*')
        .eq('custom_product_id', id)
        .order('size', { ascending: true })
        .order('color', { ascending: true });

      if (variantsError) throw variantsError;

      return {
        ...product,
        variants: variants || [],
      } as CustomProductWithVariants;
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch custom products for Jager Basic (oversized tees)
 */
export const useCustomProductsForBasic = () => {
  return useQuery({
    queryKey: ['custom-products', 'basic'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_products')
        .select('*')
        .eq('is_active', true)
        .eq('category', 'OVERSIZED_TEE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomProduct[];
    },
  });
};

