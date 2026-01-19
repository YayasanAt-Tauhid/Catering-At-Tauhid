import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import TrackOrderPage from "./pages/TrackOrderPage";

// Guest Pages
import GuestMenuPage from "./pages/guest/GuestMenuPage";
import GuestCartPage from "./pages/guest/GuestCartPage";
import GuestCheckoutPage from "./pages/guest/GuestCheckoutPage";
import OrderConfirmationPage from "./pages/guest/OrderConfirmationPage";

// Dashboard Pages
import DashboardLayout from "./components/layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import MenuPage from "./pages/dashboard/MenuPage";
import CartPage from "./pages/dashboard/CartPage";
import CheckoutPage from "./pages/dashboard/CheckoutPage";
import RecipientsPage from "./pages/dashboard/RecipientsPage";
import OrdersPage from "./pages/dashboard/OrdersPage";
import OrderDetailPage from "./pages/dashboard/OrderDetailPage";
import InvoicesPage from "./pages/dashboard/InvoicesPage";
import SettingsPage from "./pages/dashboard/SettingsPage";

// Admin Pages
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMenuPage from "./pages/admin/AdminMenuPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminFinancePage from "./pages/admin/AdminFinancePage";
import AdminHolidaysPage from "./pages/admin/AdminHolidaysPage";

// Kitchen Pages
import KitchenLayout from "./components/layouts/KitchenLayout";
import KitchenDashboard from "./pages/kitchen/KitchenDashboard";
import KitchenPrintTicket from "./pages/kitchen/KitchenPrintTicket";

// Cashier Pages
import CashierLayout from "./components/layouts/CashierLayout";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import CashierPaymentHistory from "./pages/cashier/CashierPaymentHistory";
import CashierDailyReport from "./pages/cashier/CashierDailyReport";
import CashierOrderDetail from "./pages/cashier/CashierOrderDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/track" element={<TrackOrderPage />} />
              
              {/* Guest Checkout Routes */}
              <Route path="/guest/menu" element={<GuestMenuPage />} />
              <Route path="/guest/cart" element={<GuestCartPage />} />
              <Route path="/guest/checkout" element={<GuestCheckoutPage />} />
              <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
              
              {/* Parent Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="recipients" element={<RecipientsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Admin Dashboard */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="menu" element={<AdminMenuPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="invoices" element={<AdminFinancePage />} />
                <Route path="holidays" element={<AdminHolidaysPage />} />
              </Route>

              {/* Kitchen Dashboard */}
              <Route path="/kitchen" element={<KitchenLayout />}>
                <Route index element={<KitchenDashboard />} />
                <Route path="print" element={<KitchenPrintTicket />} />
              </Route>

              {/* Cashier Dashboard */}
              <Route path="/cashier" element={<CashierLayout />}>
                <Route index element={<CashierDashboard />} />
                <Route path="history" element={<CashierPaymentHistory />} />
                <Route path="report" element={<CashierDailyReport />} />
                <Route path="orders" element={<CashierOrderDetail />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
