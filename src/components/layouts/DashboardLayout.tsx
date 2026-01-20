import {
  Link,
  useNavigate,
  useLocation,
  Outlet,
  Navigate,
} from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Home,
  ShoppingCart,
  Users,
  History,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChefHat,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/dashboard/menu", icon: ChefHat, label: "Pesan Makanan" },
  { to: "/dashboard/cart", icon: ShoppingCart, label: "Keranjang" },
  { to: "/dashboard/recipients", icon: Users, label: "Penerima" },
  { to: "/dashboard/orders", icon: History, label: "Riwayat Order" },
  { to: "/dashboard/invoices", icon: FileText, label: "Invoice" },
  { to: "/dashboard/settings", icon: Settings, label: "Pengaturan" },
];

export default function DashboardLayout() {
  const { cart } = useApp();
  const { user, profile, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        setIsAdmin(!!data);
      }
    };
    checkAdminRole();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Block admins from accessing customer dashboard - redirect to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Dapoer-Attauhid</span>
          </div>
        </div>
        <Link to="/dashboard/cart" className="relative">
          <Button variant="ghost" size="icon">
            <ShoppingCart className="w-5 h-5" />
          </Button>
          {cartItemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {cartItemCount}
            </Badge>
          )}
        </Link>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
                <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Dapoer-Attauhid</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">
                  {(profile?.full_name || user?.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.to === "/dashboard/cart" && cartItemCount > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "default"}
                      className="ml-auto"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin Panel Link (only for admins) */}
          {isAdmin && (
            <div className="px-4 pb-4">
              <Link to="/admin">
                <Button
                  variant="outline"
                  className="w-full justify-start border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Admin Panel
                </Button>
              </Link>
            </div>
          )}

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
