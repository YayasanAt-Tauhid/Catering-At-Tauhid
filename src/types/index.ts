// Types for the food ordering application

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'parent' | 'admin';
  createdAt: Date;
}

export interface Recipient {
  id: string;
  userId: string;
  name: string;
  class: string;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_available: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  recipientId: string;
  recipientName: string;
  recipientClass: string;
  items: OrderItem[];
  totalPrice: number;
  deliveryDate: Date;
  status: OrderStatus;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface Invoice {
  id: string;
  orderId: string;
  order: Order;
  generatedAt: Date;
}

export interface CombinedInvoice {
  id: string;
  orders: Order[];
  totalAmount: number;
  generatedAt: Date;
}
