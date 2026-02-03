import { forwardRef, useImperativeHandle, useRef } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface OrderItem {
  id: string;
  order_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  menu_item: {
    name: string;
  } | null;
}

interface ReceiptOrder {
  id: string;
  total_amount: number;
  delivery_date: string | null;
  recipient?: {
    name: string;
    class: string | null;
  } | null;
  guest_name?: string | null;
  guest_class?: string | null;
  order_items: OrderItem[];
}

interface CashierReceiptProps {
  customerName: string;
  orders: ReceiptOrder[];
  totalAmount: number;
  paymentDate: Date;
  isCombined: boolean;
}

export interface CashierReceiptHandle {
  print: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const CashierReceipt = forwardRef<CashierReceiptHandle, CashierReceiptProps>(
  ({ customerName, orders, totalAmount, paymentDate, isCombined }, ref) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      print: () => {
        if (!receiptRef.current) return;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Popup blocked! Please allow popups for this site.');
          return;
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Struk Pembayaran</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px;
                padding: 10px;
                width: 80mm;
                margin: 0 auto;
              }
              .receipt { width: 100%; }
              .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
              .header h1 { font-size: 16px; font-weight: bold; }
              .header p { font-size: 10px; }
              .info { margin: 10px 0; }
              .info-row { display: flex; justify-content: space-between; margin: 4px 0; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .order-section { margin: 10px 0; }
              .order-header { font-weight: bold; background: #f0f0f0; padding: 4px; margin-bottom: 5px; }
              .item { display: flex; justify-content: space-between; margin: 2px 0; }
              .item-name { flex: 1; }
              .item-qty { width: 40px; text-align: center; }
              .item-price { width: 80px; text-align: right; }
              .total-section { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
              .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
              .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
              @media print {
                body { width: 80mm; }
                @page { size: 80mm auto; margin: 0; }
              }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }));

    return (
      <div className="hidden">
        <div ref={receiptRef} className="receipt">
          <div className="header">
            <h1>KATERING SEKOLAH</h1>
            <p>Struk Pembayaran Tunai</p>
          </div>

          <div className="info">
            <div className="info-row">
              <span>Tanggal:</span>
              <span>{format(paymentDate, "d MMM yyyy HH:mm", { locale: id })}</span>
            </div>
            <div className="info-row">
              <span>Customer:</span>
              <span>{customerName}</span>
            </div>
            {isCombined && orders.length > 1 && (
              <div className="info-row">
                <span>Jml Pesanan:</span>
                <span>{orders.length} pesanan</span>
              </div>
            )}
          </div>

          <div className="divider" />

          {orders.map((order, idx) => (
            <div key={order.id} className="order-section">
              {isCombined && orders.length > 1 && (
                <div className="order-header">
                  Pesanan {idx + 1} - {order.recipient?.name ?? order.guest_name ?? 'Penerima'}
                  {order.delivery_date && (
                    <span> ({format(new Date(order.delivery_date), "d/M", { locale: id })})</span>
                  )}
                </div>
              )}
              {!isCombined && order.recipient && (
                <div className="order-header">
                  Penerima: {order.recipient.name}
                  {order.recipient.class && ` (${order.recipient.class})`}
                </div>
              )}
              {order.order_items.map((item) => (
                <div key={item.id} className="item">
                  <span className="item-name">{item.menu_item?.name ?? 'Item'}</span>
                  <span className="item-qty">x{item.quantity}</span>
                  <span className="item-price">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              {isCombined && orders.length > 1 && (
                <div className="item" style={{ fontWeight: 'bold', marginTop: '4px' }}>
                  <span>Subtotal:</span>
                  <span></span>
                  <span className="item-price">{formatCurrency(order.total_amount)}</span>
                </div>
              )}
            </div>
          ))}

          <div className="total-section">
            <div className="total-row">
              <span>TOTAL</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="info-row" style={{ marginTop: '4px' }}>
              <span>Metode:</span>
              <span>TUNAI</span>
            </div>
          </div>

          <div className="footer">
            <p>Terima kasih atas pembayaran Anda!</p>
            <p>Struk ini adalah bukti pembayaran yang sah.</p>
          </div>
        </div>
      </div>
    );
  }
);

CashierReceipt.displayName = "CashierReceipt";
