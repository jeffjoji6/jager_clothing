import { useQuery } from '@tanstack/react-query';
import { supabase, Product, ProductVariant } from '@/lib/supabase';

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch variants for each product
      const productsWithVariants = await Promise.all(
        (products || []).map(async (product) => {
          const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id);

          if (variantsError) throw variantsError;

          return {
            ...product,
            variants: variants || [],
          } as ProductWithVariants;
        })
      );

      return productsWithVariants;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_archived', false)
        .single();

      if (error) throw error;

      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      if (variantsError) throw variantsError;

      return {
        ...product,
        variants: variants || [],
      } as ProductWithVariants;
    },
    enabled: !!id,
  });
};

export const useProductsByCategory = (category: string | null) => {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: async () => {
      let query = supabase.from('products').select('*').eq('is_archived', false);

      if (category && category !== 'ALL') {
        query = query.eq('category', category);
      }

      const { data: products, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const productsWithVariants = await Promise.all(
        (products || []).map(async (product) => {
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id);

          return {
            ...product,
            variants: variants || [],
          } as ProductWithVariants;
        })
      );

      return productsWithVariants;
    },
    enabled: true,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      const productsWithVariants = await Promise.all(
        (products || []).map(async (product) => {
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id);

          return {
            ...product,
            variants: variants || [],
          } as ProductWithVariants;
        })
      );

      return productsWithVariants;
    },
  });
};

