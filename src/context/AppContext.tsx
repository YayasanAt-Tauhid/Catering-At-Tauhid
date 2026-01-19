import React, { createContext, useContext, ReactNode } from 'react';
import { useRecipients, Recipient } from '@/hooks/useRecipients';
import { useMenuItems, MenuItem } from '@/hooks/useMenuItems';
import { useOrders, Order, OrderStatus } from '@/hooks/useOrders';
import { useCart, CartItem } from '@/hooks/useCart';

interface AppContextType {
  // Recipients
  recipients: Recipient[];
  recipientsLoading: boolean;
  addRecipient: (data: { name: string; class: string }) => Promise<Recipient | null>;
  updateRecipient: (id: string, data: { name?: string; class?: string }) => Promise<boolean>;
  deleteRecipient: (id: string) => Promise<{ success: boolean; reason?: string }>;
  getOrderCount: (recipientId: string) => Promise<number>;

  // Menu Items
  menuItems: MenuItem[];
  menuItemsLoading: boolean;
  categories: string[];
  addMenuItem: (data: { name: string; description: string; price: number; category: string; image_url?: string }) => Promise<MenuItem | null>;
  updateMenuItem: (id: string, data: { name?: string; description?: string; price?: number; category?: string; image_url?: string; is_available?: boolean }) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  toggleAvailability: (id: string) => Promise<boolean>;

  // Cart
  cart: CartItem[];
  addToCart: (menuItem: MenuItem, quantity?: number) => void;
  updateCartQuantity: (menuItemId: string, quantity: number) => void;
  removeFromCart: (menuItemId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;

  // Orders
  orders: Order[];
  ordersLoading: boolean;
  createOrder: (data: {
    recipientId: string;
    deliveryDate: Date;
    items: Array<{ menuItemId: string; quantity: number; unitPrice: number }>;
  }) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  refetchOrders: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const {
    recipients,
    isLoading: recipientsLoading,
    addRecipient,
    updateRecipient,
    deleteRecipient,
    getOrderCount,
  } = useRecipients();

  const {
    menuItems,
    categories,
    isLoading: menuItemsLoading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
  } = useMenuItems();

  const {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
  } = useCart();

  const {
    orders,
    isLoading: ordersLoading,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    refetch: refetchOrders,
  } = useOrders();

  return (
    <AppContext.Provider
      value={{
        recipients,
        recipientsLoading,
        addRecipient,
        updateRecipient,
        deleteRecipient,
        getOrderCount,
        menuItems,
        menuItemsLoading,
        categories,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleAvailability,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartItemCount,
        orders,
        ordersLoading,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        getOrderById,
        refetchOrders,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
