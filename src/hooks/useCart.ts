import { useState, useCallback, useEffect } from 'react';
import { MenuItem } from '@/hooks/useMenuItems';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

const CART_STORAGE_KEY = 'katering-cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((menuItem: MenuItem, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { menuItem, quantity }];
    });
  }, []);

  const updateCartQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.menuItem.id !== menuItemId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.menuItem.id === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItem.id !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
  };
}
