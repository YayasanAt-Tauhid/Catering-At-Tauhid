/**
 * Check if an order is expired based on delivery date and cutoff time (5 AM)
 * Order dianggap expired jika: status pending dan sudah melewati jam 5 pagi di tanggal pengiriman
 */
export const isOrderExpired = (order: {
  status: string;
  delivery_date: string | null;
}): boolean => {
  if (order.status !== 'pending' || !order.delivery_date) return false;
  
  // Set cutoff time to 5 AM on delivery date
  const deliveryDate = new Date(order.delivery_date);
  deliveryDate.setHours(5, 0, 0, 0);
  
  const now = new Date();
  
  return now >= deliveryDate;
};

/**
 * Get display status considering expired orders
 */
export const getOrderDisplayStatus = (order: {
  status: string;
  delivery_date: string | null;
}): string => {
  if (isOrderExpired(order)) return 'expired';
  return order.status;
};

type BadgeVariant = 'paid' | 'pending' | 'failed' | 'expired';

interface StatusBadgeConfig {
  variant: BadgeVariant;
  label: string;
  color?: string;
}

/**
 * Get status badge configuration for order display
 */
export const getOrderStatusBadge = (order: {
  status: string;
  delivery_date: string | null;
}): StatusBadgeConfig => {
  if (isOrderExpired(order)) {
    return { variant: 'expired', label: 'Expired', color: 'text-muted-foreground' };
  }
  
  const configs: Record<string, StatusBadgeConfig> = {
    paid: { variant: 'paid', label: 'Lunas', color: 'text-success' },
    pending: { variant: 'pending', label: 'Pending', color: 'text-warning' },
    confirmed: { variant: 'paid', label: 'Dikonfirmasi', color: 'text-success' },
    preparing: { variant: 'paid', label: 'Diproses', color: 'text-info' },
    delivered: { variant: 'paid', label: 'Terkirim', color: 'text-success' },
    failed: { variant: 'failed', label: 'Gagal', color: 'text-destructive' },
    cancelled: { variant: 'failed', label: 'Dibatalkan', color: 'text-destructive' },
    expired: { variant: 'expired', label: 'Expired', color: 'text-muted-foreground' },
  };
  
  return configs[order.status] || { variant: 'pending', label: order.status, color: 'text-warning' };
};
