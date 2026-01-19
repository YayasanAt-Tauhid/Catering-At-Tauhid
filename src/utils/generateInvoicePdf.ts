import { Order } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface GuestOrderData {
  id: string;
  order_code: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_class: string | null;
  delivery_date: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    menu_item: {
      name: string;
      image_url: string | null;
    } | null;
  }[];
}

export function generateInvoicePdf(order: Order) {
  const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.id.slice(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f97316; }
    .logo { font-size: 28px; font-weight: bold; color: #f97316; }
    .logo-sub { font-size: 12px; color: #666; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 24px; font-weight: bold; color: #333; }
    .invoice-date { color: #666; margin-top: 5px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 10px; }
    .recipient-box { background: #f9fafb; padding: 20px; border-radius: 8px; }
    .recipient-name { font-size: 18px; font-weight: 600; }
    .recipient-class { color: #666; margin-top: 5px; }
    .delivery-date { margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { text-align: left; padding: 12px; background: #f97316; color: white; font-weight: 600; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .total-row { background: #fff7ed; }
    .total-row td { font-weight: bold; font-size: 16px; color: #f97316; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">MakanSekolah</div>
        <div class="logo-sub">Layanan Catering Sekolah</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-number">INV-${order.id.slice(0, 8).toUpperCase()}</div>
        <div class="invoice-date">${format(new Date(order.created_at), 'd MMMM yyyy', { locale: id })}</div>
        <div class="status ${order.status}">${order.status === 'paid' ? 'LUNAS' : 'PENDING'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Informasi Penerima</div>
      <div class="recipient-box">
        <div class="recipient-name">${order.recipient?.name || '-'}</div>
        <div class="recipient-class">Kelas: ${order.recipient?.class || '-'}</div>
        <div class="delivery-date">
          <strong>Tanggal Pengiriman:</strong> ${order.delivery_date ? format(new Date(order.delivery_date), 'EEEE, d MMMM yyyy', { locale: id }) : '-'}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Detail Pesanan</div>
      <table>
        <thead>
          <tr>
            <th>Menu</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.order_items?.map(item => `
            <tr>
              <td>${item.menu_item?.name || 'Menu'}</td>
              <td>${item.quantity}</td>
              <td>Rp ${item.unit_price.toLocaleString('id-ID')}</td>
              <td>Rp ${item.subtotal.toLocaleString('id-ID')}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">Tidak ada item</td></tr>'}
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td>Rp ${order.total_amount.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Terima kasih telah menggunakan layanan MakanSekolah</p>
      <p>Invoice ini dibuat secara otomatis dan sah tanpa tanda tangan</p>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  }
}

export function generateGuestInvoicePdf(order: GuestOrderData) {
  const isPaid = order.status === 'paid' || order.status === 'confirmed';
  
  const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.order_code || order.id.slice(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f97316; }
    .logo { font-size: 28px; font-weight: bold; color: #f97316; }
    .logo-sub { font-size: 12px; color: #666; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 24px; font-weight: bold; color: #333; }
    .invoice-date { color: #666; margin-top: 5px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.confirmed { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 10px; }
    .recipient-box { background: #f9fafb; padding: 20px; border-radius: 8px; }
    .recipient-name { font-size: 18px; font-weight: 600; }
    .recipient-detail { color: #666; margin-top: 5px; }
    .delivery-date { margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { text-align: left; padding: 12px; background: #f97316; color: white; font-weight: 600; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .total-row { background: #fff7ed; }
    .total-row td { font-weight: bold; font-size: 16px; color: #f97316; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
    .order-code { font-family: monospace; font-size: 14px; color: #f97316; margin-top: 5px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">MakanSekolah</div>
        <div class="logo-sub">Layanan Catering Sekolah</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-number">${order.order_code || 'INV-' + order.id.slice(0, 8).toUpperCase()}</div>
        <div class="invoice-date">${format(new Date(order.created_at), 'd MMMM yyyy', { locale: id })}</div>
        <div class="status ${order.status}">${isPaid ? 'LUNAS' : 'PENDING'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Informasi Pemesan</div>
      <div class="recipient-box">
        <div class="recipient-name">${order.guest_name || '-'}</div>
        <div class="recipient-detail">No. HP: ${order.guest_phone || '-'}</div>
        <div class="recipient-detail">Kelas: ${order.guest_class || '-'}</div>
        <div class="delivery-date">
          <strong>Tanggal Pengiriman:</strong> ${order.delivery_date ? format(new Date(order.delivery_date), 'EEEE, d MMMM yyyy', { locale: id }) : '-'}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Detail Pesanan</div>
      <table>
        <thead>
          <tr>
            <th>Menu</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.order_items?.map(item => `
            <tr>
              <td>${item.menu_item?.name || 'Menu'}</td>
              <td>${item.quantity}</td>
              <td>Rp ${item.unit_price.toLocaleString('id-ID')}</td>
              <td>Rp ${item.subtotal.toLocaleString('id-ID')}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">Tidak ada item</td></tr>'}
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td>Rp ${order.total_amount.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Terima kasih telah menggunakan layanan MakanSekolah</p>
      <p>Invoice ini dibuat secara otomatis dan sah tanpa tanda tangan</p>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  }
}

export function generateCombinedInvoicePdf(orders: Order[]) {
  const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
  
  const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice Gabungan</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f97316; }
    .logo { font-size: 28px; font-weight: bold; color: #f97316; }
    .logo-sub { font-size: 12px; color: #666; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 24px; font-weight: bold; color: #333; }
    .invoice-date { color: #666; margin-top: 5px; }
    .order-section { margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
    .order-id { font-weight: 600; color: #f97316; }
    .recipient { font-size: 14px; color: #666; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px; background: #e5e7eb; font-weight: 600; font-size: 12px; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .order-total { text-align: right; font-weight: 600; margin-top: 10px; }
    .grand-total { margin-top: 30px; padding: 20px; background: #fff7ed; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .grand-total-label { font-size: 18px; font-weight: 600; }
    .grand-total-amount { font-size: 24px; font-weight: bold; color: #f97316; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">MakanSekolah</div>
        <div class="logo-sub">Invoice Gabungan</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-number">INV-COMBINED</div>
        <div class="invoice-date">${format(new Date(), 'd MMMM yyyy', { locale: id })}</div>
      </div>
    </div>

    ${orders.map(order => `
      <div class="order-section">
        <div class="order-header">
          <div>
            <div class="order-id">Order #${order.id.slice(0, 8)}</div>
            <div class="recipient">${order.recipient?.name || '-'} - Kelas ${order.recipient?.class || '-'}</div>
          </div>
          <div class="recipient">${order.delivery_date ? format(new Date(order.delivery_date), 'd MMM yyyy', { locale: id }) : '-'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Menu</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items?.map(item => `
              <tr>
                <td>${item.menu_item?.name || 'Menu'}</td>
                <td>${item.quantity}</td>
                <td>Rp ${item.subtotal.toLocaleString('id-ID')}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        <div class="order-total">Subtotal: Rp ${order.total_amount.toLocaleString('id-ID')}</div>
      </div>
    `).join('')}

    <div class="grand-total">
      <div class="grand-total-label">Total Keseluruhan (${orders.length} Invoice)</div>
      <div class="grand-total-amount">Rp ${totalAmount.toLocaleString('id-ID')}</div>
    </div>

    <div class="footer">
      <p>Terima kasih telah menggunakan layanan MakanSekolah</p>
      <p>Invoice ini dibuat secara otomatis dan sah tanpa tanda tangan</p>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  }
}
