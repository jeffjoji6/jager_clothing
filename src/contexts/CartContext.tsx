import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string; // variant_id for Supabase sync
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
  variant_id?: string; // For Supabase cart table
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  removeItem: (id: string, size: string) => Promise<void>;
  updateQuantity: (id: string, size: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'jager_cart';

// Load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save cart to localStorage
const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart from Supabase or localStorage
  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('carts')
          .select(`
            *,
            variant:product_variants(
              *,
              product:products(*)
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const cartItems: CartItem[] = (data || []).map((cart) => {
          const variant = cart.variant as any;
          const product = variant?.product;
          return {
            id: variant?.id || cart.product_variant_id,
            variant_id: cart.product_variant_id,
            name: `${product?.name || ''} - ${variant?.size || ''} - ${variant?.color || ''}`,
            price: Number(product?.base_price || 0) + Number(variant?.price_modifier || 0),
            image: Array.isArray(product?.images) ? product.images[0] : product?.images || '/placeholder.svg',
            size: variant?.size || '',
            quantity: cart.quantity,
          };
        });

        setItems(cartItems);
        // Merge with localStorage cart if exists
        const localCart = loadCartFromStorage();
        if (localCart.length > 0) {
          // Merge logic: prefer Supabase, but add unique items from local
          const merged = [...cartItems];
          localCart.forEach((localItem) => {
            const exists = merged.find((i) => i.id === localItem.id && i.size === localItem.size);
            if (!exists) {
              merged.push(localItem);
            }
          });
          setItems(merged);
          // Save merged cart to Supabase
          await syncToSupabase(merged);
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        // Load from localStorage
        const localCart = loadCartFromStorage();
        setItems(localCart);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Fallback to localStorage
      const localCart = loadCartFromStorage();
      setItems(localCart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sync cart to Supabase
  const syncToSupabase = async (cartItems: CartItem[]) => {
    if (!user) return;

    try {
      // Get current cart items
      const { data: existingCarts } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id);

      // Delete items not in current cart
      const itemsToDelete = (existingCarts || []).filter(
        cart => !cartItems.find(item => item.variant_id === cart.product_variant_id)
      );
      if (itemsToDelete.length > 0) {
        await supabase
          .from('carts')
          .delete()
          .in('id', itemsToDelete.map(c => c.id));
      }

      // Upsert cart items
      const upserts = cartItems.map(item => ({
        user_id: user.id,
        product_variant_id: item.variant_id || item.id,
        quantity: item.quantity,
      }));

      if (upserts.length > 0) {
        await supabase.from('carts').upsert(upserts, {
          onConflict: 'user_id,product_variant_id',
        });
      }
    } catch (error) {
      console.error('Failed to sync cart to Supabase:', error);
    }
  };

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Save to localStorage when items change (for guest users)
  useEffect(() => {
    if (!user && items.length >= 0) {
      saveCartToStorage(items);
    }
  }, [items, user]);

  const addItem = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.size === item.size);
      const quantityToAdd = item.quantity || 1;

      let updated;
      if (existing) {
        updated = prev.map((i) =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: i.quantity + quantityToAdd }
            : i
        );
      } else {
        updated = [...prev, { ...item, quantity: quantityToAdd }];
      }
      if (user) {
        syncToSupabase(updated);
      }
      return updated;
    });
  };

  const removeItem = async (id: string, size: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => !(i.id === id && i.size === size));
      if (user) {
        syncToSupabase(updated);
      }
      return updated;
    });
  };

  const updateQuantity = async (id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(id, size);
      return;
    }
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.id === id && i.size === size ? { ...i, quantity } : i
      );
      if (user) {
        syncToSupabase(updated);
      }
      return updated;
    });
  };

  const clearCart = async () => {
    if (user) {
      await supabase.from('carts').delete().eq('user_id', user.id);
    }
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
